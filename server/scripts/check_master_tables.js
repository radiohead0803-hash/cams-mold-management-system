/**
 * 마스터 데이터 테이블 존재 여부 및 데이터 확인 스크립트
 */
const { sequelize } = require('../src/models');

async function checkMasterTables() {
  try {
    console.log('=== 마스터 데이터 테이블 확인 ===\n');

    // 1. 테이블 존재 여부 확인
    const [tables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (
        table_name LIKE '%car_model%' 
        OR table_name LIKE '%material%' 
        OR table_name LIKE '%mold_type%' 
        OR table_name LIKE '%tonnage%'
      )
      ORDER BY table_name
    `);

    console.log('발견된 마스터 테이블:');
    if (tables.length === 0) {
      console.log('  (없음) - 마스터 데이터 테이블이 생성되지 않았습니다!\n');
    } else {
      tables.forEach(t => console.log(`  - ${t.table_name}`));
      console.log('');
    }

    // 2. 각 테이블 데이터 수 확인
    const masterTables = ['car_models', 'materials', 'mold_types', 'tonnages'];
    
    for (const tableName of masterTables) {
      try {
        const [countResult] = await sequelize.query(`SELECT COUNT(*) as cnt FROM ${tableName}`);
        console.log(`${tableName}: ${countResult[0].cnt}개 레코드`);
      } catch (err) {
        console.log(`${tableName}: 테이블 없음 또는 오류 - ${err.message}`);
      }
    }

    console.log('\n=== 전체 테이블 목록 (public 스키마) ===');
    const [allTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    allTables.forEach(t => console.log(`  - ${t.table_name}`));

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkMasterTables();
