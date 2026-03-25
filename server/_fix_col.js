const { Client } = require('pg');
const c = new Client('postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway');
c.connect().then(async () => {
  await c.query(`ALTER TABLE maintenance_records ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb`);
  console.log('photos 컬럼 추가 완료');
  await c.end();
}).catch(e => { console.error(e.message); c.end(); });
