/**
 * 부품사진 필드 추가 마이그레이션 실행 스크립트
 * 
 * 실행 방법:
 * node run-part-images-migration.js
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  logging: console.log,
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
});

async function runMigration() {
  try {
    console.log('🔄 데이터베이스 연결 중...');
    await sequelize.authenticate();
    console.log('✅ 데이터베이스 연결 성공');

    console.log('\n📝 part_images 필드 추가 중...');
    
    // part_images 필드가 이미 존재하는지 확인
    const [results] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mold_specifications' 
      AND column_name = 'part_images'
    `);

    if (results.length > 0) {
      console.log('⚠️  part_images 필드가 이미 존재합니다. 스킵합니다.');
    } else {
      // part_images 필드 추가
      await sequelize.query(`
        ALTER TABLE mold_specifications 
        ADD COLUMN part_images JSONB DEFAULT NULL
      `);
      
      await sequelize.query(`
        COMMENT ON COLUMN mold_specifications.part_images 
        IS '부품 사진 URL 배열 - [{"url": "...", "filename": "...", "uploaded_at": "..."}]'
      `);

      console.log('✅ part_images 필드가 성공적으로 추가되었습니다.');
    }

    // 테이블 구조 확인
    console.log('\n📋 mold_specifications 테이블 구조:');
    const [columns] = await sequelize.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'mold_specifications'
      ORDER BY ordinal_position
    `);
    
    console.table(columns);

    console.log('\n✅ 마이그레이션 완료!');
    process.exit(0);
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

runMigration();
