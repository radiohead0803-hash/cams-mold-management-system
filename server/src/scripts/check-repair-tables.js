const { Sequelize } = require('sequelize');
const DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const s = new Sequelize(DB_URL, { logging: false });

(async () => {
  try {
    // repair 관련 테이블 목록
    const [tables] = await s.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE '%repair%'
      ORDER BY table_name
    `);
    console.log('=== repair 관련 테이블 ===');
    tables.forEach(t => console.log(`  ${t.table_name}`));

    // repair_requests 컬럼
    const [cols] = await s.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'repair_requests' 
      ORDER BY ordinal_position
    `);
    console.log('\n=== repair_requests columns ===');
    cols.forEach(c => console.log(`  ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''}`));

    // repair_workflow_history 존재 여부
    const [wfh] = await s.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'repair_workflow_history' 
      ORDER BY ordinal_position
    `);
    if (wfh.length > 0) {
      console.log('\n=== repair_workflow_history columns ===');
      wfh.forEach(c => console.log(`  ${c.column_name}: ${c.data_type}`));
    } else {
      console.log('\n[!] repair_workflow_history 테이블 없음');
    }

    // repair_requests 데이터 샘플
    const [samples] = await s.query('SELECT id, status, mold_id, created_at FROM repair_requests LIMIT 3');
    console.log('\n=== repair_requests samples ===');
    console.log(JSON.stringify(samples, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await s.close();
  }
})();
