/* eslint-disable no-console */
const { Client } = require('pg');

const PENDING = [
  '20251120100000-create-database-schema-v09.js',
  '20251120110000-update-user-schema.js',
  '20251120110001-update-mold-schema.js',
  '20251120110002-create-qr-sessions.js',
  '20251120120000-add-inspection-tables.js',
  '20251120130000-add-repair-tables.js',
  '20251120140000-add-transfer-tables.js',
  '20251120150000-add-additional-tables.js',
  '20251125-update-molds-nullable-fields.js',
  '20251126-update-target-maker-id-reference.js',
  '20251127000000-add-part-images-to-mold-specifications.js',
  '20251127000001-create-master-data-tables.js'
];

(async () => {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query('CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) NOT NULL UNIQUE)');

    const existing = await client.query('SELECT name FROM "SequelizeMeta"');
    const have = new Set(existing.rows.map(r => r.name));

    for (const name of PENDING) {
      if (!have.has(name)) {
        await client.query('INSERT INTO "SequelizeMeta" (name) VALUES ($1)', [name]);
        console.log('Marked as up:', name);
      } else {
        console.log('Already up:', name);
      }
    }

    console.log('All specified migrations are marked as up.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('mark_pending_migrations_up failed:', err.message);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
})();
