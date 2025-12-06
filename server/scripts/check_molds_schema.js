/**
 * molds 테이블 스키마 확인 스크립트
 */
const { sequelize } = require('../src/models');

async function checkMoldsSchema() {
  try {
    console.log('=== molds 테이블 컬럼 확인 ===\n');

    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'molds' 
      ORDER BY ordinal_position
    `);

    if (columns.length === 0) {
      console.log('molds 테이블이 존재하지 않습니다!');
    } else {
      console.log('컬럼 목록:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type})`);
      });
    }

    // 필요한 컬럼 확인
    const requiredColumns = ['car_model_id', 'material_id', 'mold_type_id', 'tonnage_id'];
    console.log('\n=== 필수 컬럼 확인 ===');
    for (const colName of requiredColumns) {
      const exists = columns.some(c => c.column_name === colName);
      console.log(`${colName}: ${exists ? '✅ 존재' : '❌ 없음'}`);
    }

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkMoldsSchema();
