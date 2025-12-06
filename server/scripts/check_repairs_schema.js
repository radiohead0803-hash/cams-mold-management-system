/**
 * repairs 테이블 스키마 확인 스크립트
 */
const { sequelize } = require('../src/models');

async function checkRepairsSchema() {
  try {
    console.log('=== repairs 테이블 컬럼 확인 ===\n');

    const [columns] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'repairs' 
      ORDER BY ordinal_position
    `);

    if (columns.length === 0) {
      console.log('repairs 테이블이 존재하지 않습니다!');
    } else {
      console.log('컬럼 목록:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`);
      });
    }

    // mold_id 컬럼 존재 여부 확인
    const hasMoldId = columns.some(c => c.column_name === 'mold_id');
    console.log(`\nmold_id 컬럼 존재: ${hasMoldId ? '예' : '아니오'}`);

    if (!hasMoldId) {
      console.log('\n=== mold_id 컬럼 추가 필요 ===');
      console.log('실행할 SQL:');
      console.log('ALTER TABLE repairs ADD COLUMN mold_id INTEGER REFERENCES molds(id);');
    }

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkRepairsSchema();
