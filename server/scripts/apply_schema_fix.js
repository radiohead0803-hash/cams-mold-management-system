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
    console.log('Connected to DB');

    const statements = [
      // molds table
      `CREATE TABLE IF NOT EXISTS molds (
        id SERIAL PRIMARY KEY,
        mold_code VARCHAR(50) UNIQUE NOT NULL,
        mold_name VARCHAR(200) NOT NULL,
        car_model VARCHAR(100),
        part_name VARCHAR(200),
        cavity INTEGER,
        plant_id INTEGER,
        maker_id INTEGER,
        qr_token VARCHAR(255) UNIQUE,
        sop_date DATE,
        eop_date DATE,
        target_shots INTEGER,
        status VARCHAR(20) DEFAULT 'active',
        location VARCHAR(200),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );`,
      `CREATE INDEX IF NOT EXISTS idx_molds_plant ON molds(plant_id);`,
      `CREATE INDEX IF NOT EXISTS idx_molds_maker ON molds(maker_id);`,
      `CREATE INDEX IF NOT EXISTS idx_molds_qr_token ON molds(qr_token);`,
      `CREATE INDEX IF NOT EXISTS idx_molds_status ON molds(status);`,

      // mold_specifications columns/indexes
      `ALTER TABLE mold_specifications
         ADD COLUMN IF NOT EXISTS external_system_id VARCHAR(100);`,
      `CREATE INDEX IF NOT EXISTS idx_mold_specifications_part ON mold_specifications(part_number);`,
      `CREATE INDEX IF NOT EXISTS idx_mold_specifications_maker ON mold_specifications(target_maker_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mold_specifications_external ON mold_specifications(external_system_id);`,
      `CREATE INDEX IF NOT EXISTS idx_mold_specifications_status ON mold_specifications(status);`,

      // FK mold_specifications.mold_id -> molds(id)
      `DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints
          WHERE constraint_name = 'fk_mold_specifications_mold_id'
            AND table_name = 'mold_specifications'
        ) THEN
          ALTER TABLE mold_specifications
            ADD CONSTRAINT fk_mold_specifications_mold_id
            FOREIGN KEY (mold_id) REFERENCES molds(id)
            ON UPDATE CASCADE ON DELETE SET NULL;
        END IF;
      END $$;`,

      // SequelizeMeta (safety)
      `CREATE TABLE IF NOT EXISTS "SequelizeMeta" (name VARCHAR(255) NOT NULL UNIQUE)`
    ];

    for (const sql of statements) {
      console.log('Executing:\n', sql.split('\n')[0], '...');
      await client.query(sql);
    }

    // Verification queries
    const reg = await client.query(
      `SELECT to_regclass('public.molds') AS molds_table,
              to_regclass('public.mold_specifications') AS specs_table`
    );
    console.log('Tables:', reg.rows[0]);

    const idx = await client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename='molds' ORDER BY indexname`
    );
    console.log('molds indexes:', idx.rows.map(r => r.indexname));

    const cols = await client.query(
      `SELECT column_name FROM information_schema.columns
       WHERE table_name='mold_specifications' AND column_name IN ('external_system_id','mold_id')
       ORDER BY column_name`
    );
    console.log('mold_specifications columns:', cols.rows.map(r => r.column_name));

    console.log('Schema fix applied successfully.');
    await client.end();
    process.exit(0);
  } catch (err) {
    console.error('Schema fix failed:', err.message);
    try { await client.end(); } catch (_) {}
    process.exit(1);
  }
})();
