/* eslint-disable no-console */
const { Client } = require('pg');
const bcrypt = require('bcryptjs');

(async () => {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();

    const username = process.env.ADMIN_USERNAME || 'admin';
    const newPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const hash = await bcrypt.hash(newPassword, 10);

    const res = await client.query(
      'UPDATE users SET password_hash=$1, updated_at=NOW() WHERE username=$2 RETURNING id',
      [hash, username]
    );

    if (res.rowCount === 0) {
      console.log(`No user found with username "${username}"`);
    } else {
      console.log(`Password reset for user ${username}, id=${res.rows[0].id}`);
    }

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Reset admin password failed:', err.message);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
})();
