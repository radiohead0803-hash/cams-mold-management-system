const webpush = require('web-push');
const { sequelize } = require('../models/newIndex');

// ────────────────────────────────────────────────
// VAPID key management
// ────────────────────────────────────────────────

let vapidKeys = null;

function initVapid() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@icams.co.kr';

  if (publicKey && privateKey) {
    vapidKeys = { publicKey, privateKey };
    console.log('[webPushService] Using VAPID keys from environment variables.');
  } else {
    // Auto-generate VAPID keys (dev convenience)
    vapidKeys = webpush.generateVAPIDKeys();
    console.log('──────────────────────────────────────────────────');
    console.log('[webPushService] VAPID keys auto-generated.');
    console.log('[webPushService] Set these in your .env for persistence:');
    console.log(`  VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`);
    console.log(`  VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`);
    console.log('──────────────────────────────────────────────────');
  }

  webpush.setVapidDetails(subject, vapidKeys.publicKey, vapidKeys.privateKey);
}

// Initialize on module load
initVapid();

// ────────────────────────────────────────────────
// Public API
// ────────────────────────────────────────────────

/**
 * Get the VAPID public key (needed by client to subscribe)
 */
function getVapidPublicKey() {
  return vapidKeys ? vapidKeys.publicKey : null;
}

/**
 * Send a push notification to a single subscription object
 * @param {{ endpoint: string, keys: { p256dh: string, auth: string } }} subscription
 * @param {{ title: string, body: string, icon?: string, url?: string, data?: object }} payload
 * @returns {Promise<boolean>}
 */
async function sendPushNotification(subscription, payload) {
  try {
    const payloadStr = JSON.stringify(payload);
    await webpush.sendNotification(subscription, payloadStr);
    return true;
  } catch (err) {
    // 410 Gone or 404 means subscription expired/invalid -> deactivate
    if (err.statusCode === 410 || err.statusCode === 404) {
      console.log(`[webPushService] Subscription expired, deactivating: ${subscription.endpoint.slice(0, 60)}...`);
      try {
        await sequelize.query(
          `UPDATE push_subscriptions SET is_active = false, updated_at = NOW() WHERE endpoint = :endpoint`,
          { replacements: { endpoint: subscription.endpoint } }
        );
      } catch (dbErr) {
        console.error('[webPushService] Failed to deactivate subscription:', dbErr.message);
      }
    } else {
      console.error('[webPushService] Push send failed:', err.message);
    }
    return false;
  }
}

/**
 * Send push notification to all active subscriptions for a user
 * @param {number} userId
 * @param {{ title: string, body: string, icon?: string, url?: string, data?: object }} payload
 * @returns {Promise<{ sent: number, failed: number }>}
 */
async function sendPushToUser(userId, payload) {
  const result = { sent: 0, failed: 0 };

  try {
    const [rows] = await sequelize.query(
      `SELECT endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = :userId AND is_active = true`,
      { replacements: { userId } }
    );

    if (!rows || rows.length === 0) return result;

    const promises = rows.map(async (row) => {
      const subscription = {
        endpoint: row.endpoint,
        keys: { p256dh: row.p256dh, auth: row.auth }
      };
      const ok = await sendPushNotification(subscription, payload);
      if (ok) result.sent++; else result.failed++;
    });

    await Promise.allSettled(promises);
  } catch (err) {
    console.error(`[webPushService] sendPushToUser(${userId}) error:`, err.message);
  }

  return result;
}

/**
 * Send push notification to multiple users
 * @param {number[]} userIds
 * @param {{ title: string, body: string, icon?: string, url?: string, data?: object }} payload
 * @returns {Promise<{ sent: number, failed: number }>}
 */
async function sendPushToUsers(userIds, payload) {
  const totals = { sent: 0, failed: 0 };

  if (!userIds || userIds.length === 0) return totals;

  const results = await Promise.allSettled(
    userIds.map(uid => sendPushToUser(uid, payload))
  );

  for (const r of results) {
    if (r.status === 'fulfilled') {
      totals.sent += r.value.sent;
      totals.failed += r.value.failed;
    }
  }

  return totals;
}

module.exports = {
  getVapidPublicKey,
  sendPushNotification,
  sendPushToUser,
  sendPushToUsers
};
