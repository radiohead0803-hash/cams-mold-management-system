const { sequelize } = require('../src/models');

async function listTables() {
  try {
    const [results] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    console.log('=== 현재 DB 테이블 목록 ===');
    results.forEach((r, i) => console.log(`${i + 1}. ${r.table_name}`));
    console.log(`\n총 ${results.length}개 테이블`);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    process.exit();
  }
}

listTables();
