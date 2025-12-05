/* eslint-disable no-console */
const { Client } = require('pg');

(async () => {
  const cs = process.env.DATABASE_URL;
  if (!cs) {
    console.error('DATABASE_URL is not set');
    process.exit(1);
  }
  const client = new Client({ connectionString: cs, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();

    // 0) Check if demo already exists
    const demoCheck = await client.query("SELECT id FROM mold_specifications WHERE part_number='DEMO-001' LIMIT 1");
    if (demoCheck.rowCount > 0) {
      console.log('Demo spec already exists. id=', demoCheck.rows[0].id);
      await client.end();
      process.exit(0);
    }

    // 1) Ensure mold exists; reuse if already present
    const moldCode = 'M-2025-001';
    let moldId;
    const existingMold = await client.query('SELECT id FROM molds WHERE mold_code=$1 LIMIT 1', [moldCode]);
    if (existingMold.rowCount > 0) {
      moldId = existingMold.rows[0].id;
      console.log('Reusing existing mold id=', moldId, 'for code', moldCode);
    } else {
      const moldRes = await client.query(
        `INSERT INTO molds (mold_code, mold_name, car_model, part_name, cavity, qr_token, target_shots, status, location)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id` ,
        [
          moldCode,
          'DEMO MOLD',
          'DEMO',
          'DEMO COVER',
          1,
          'CAMS-DEMO-001-QR',
          100000,
          'active',
          '본사'
        ]
      );
      moldId = moldRes.rows[0].id;
      console.log('Inserted new mold id=', moldId);
    }

    // 2) Insert mold_specifications dynamically based on available columns
    const colsRes = await client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='mold_specifications'`
    );
    const colSet = new Set(colsRes.rows.map(r => r.column_name));

    const insertCols = [];
    const values = [];

    function add(col, val) {
      if (colSet.has(col)) { insertCols.push(col); values.push(val); }
    }

    add('part_number', 'DEMO-001');
    add('part_name', 'DEMO COVER');
    add('car_model', 'DEMO');
    add('car_year', '2025');
    add('mold_type', '사출금형');
    add('cavity_count', 1);
    add('material', 'NAK80');
    add('tonnage', 350);
    add('development_stage', '개발');
    add('production_stage', '양산');
    add('status', 'draft');
    add('external_system_id', 'ERP-DEMO-001');
    add('external_sync_enabled', false);
    add('last_sync_date', null);
    add('mold_id', moldId);
    add('created_by', 1);
    if (colSet.has('created_at')) { insertCols.push('created_at'); values.push(new Date()); }
    if (colSet.has('updated_at')) { insertCols.push('updated_at'); values.push(new Date()); }

    if (insertCols.length === 0) {
      throw new Error('No insertable columns detected for mold_specifications');
    }

    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const sql = `INSERT INTO mold_specifications (${insertCols.join(', ')}) VALUES (${placeholders}) RETURNING id`;
    const specRes = await client.query(sql, values);

    console.log('Seeded demo: mold_id=', moldId, 'spec_id=', specRes.rows[0].id);
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Seed demo failed:', err.message);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
})();
