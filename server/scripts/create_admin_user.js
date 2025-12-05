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
    const password = process.env.ADMIN_PASSWORD || 'Admin123!';
    const name = process.env.ADMIN_NAME || '관리자';
    const email = process.env.ADMIN_EMAIL || 'admin@example.com';

    // If already exists, skip
    const exists = await client.query('SELECT id FROM users WHERE username=$1 LIMIT 1', [username]);
    if (exists.rowCount > 0) {
      console.log('Admin user already exists with id:', exists.rows[0].id);
      await client.end();
      process.exit(0);
    }

    // Inspect users table columns to decide schema
    const colsRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='users'`
    );
    const cols = colsRes.rows.map(r => r.column_name);

    const colSet = new Set(cols);
    const hash = await bcrypt.hash(password, 10);

    const insertCols = ['username', 'password_hash', 'name'];
    const values = [username, hash, name];

    if (colSet.has('email')) { insertCols.push('email'); values.push(email); }
    if (colSet.has('user_type')) { insertCols.push('user_type'); values.push('system_admin'); }
    if (colSet.has('role_group')) { insertCols.push('role_group'); values.push('hq'); }
    if (colSet.has('is_active')) { insertCols.push('is_active'); values.push(true); }
    if (colSet.has('created_at')) { insertCols.push('created_at'); values.push(new Date()); }
    if (colSet.has('updated_at')) { insertCols.push('updated_at'); values.push(new Date()); }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO users (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING id`;

    const ins = await client.query(sql, values);
    console.log('Admin user created with id:', ins.rows[0].id);

    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Create admin failed:', err.message);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
})();
