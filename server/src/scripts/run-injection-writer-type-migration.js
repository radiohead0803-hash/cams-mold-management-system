/**
 * 사출조건 작성처 구분 필드 추가 마이그레이션 스크립트
 */
const { sequelize } = require('../models/newIndex');

async function runMigration() {
  console.log('=== 사출조건 작성처 구분 필드 추가 마이그레이션 시작 ===');
  
  try {
    // 1. injection_conditions 테이블에 writer_type 컬럼 추가
    console.log('1. injection_conditions 테이블에 writer_type 컬럼 추가...');
    await sequelize.query(`
      ALTER TABLE injection_conditions 
      ADD COLUMN IF NOT EXISTS writer_type VARCHAR(30) DEFAULT 'plant'
    `);
    console.log('   - writer_type 컬럼 추가 완료');

    // 2. injection_condition_history 테이블에도 writer_type 컬럼 추가
    console.log('2. injection_condition_history 테이블에 writer_type 컬럼 추가...');
    await sequelize.query(`
      ALTER TABLE injection_condition_history 
      ADD COLUMN IF NOT EXISTS writer_type VARCHAR(30)
    `);
    console.log('   - writer_type 컬럼 추가 완료');

    // 3. 인덱스 추가
    console.log('3. 인덱스 추가...');
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_injection_conditions_writer_type 
      ON injection_conditions(writer_type)
    `);
    console.log('   - 인덱스 추가 완료');

    console.log('=== 마이그레이션 완료 ===');
    process.exit(0);
  } catch (error) {
    console.error('마이그레이션 실패:', error);
    process.exit(1);
  }
}

runMigration();
