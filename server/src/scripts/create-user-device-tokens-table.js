/**
 * user_device_tokens 테이블 생성 스크립트
 * 푸시 알림 토큰 저장용
 */

require('dotenv').config();
const { sequelize } = require('../models/newIndex');

const createTable = async () => {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected successfully.');

    console.log('Creating user_device_tokens table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_device_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        fcm_token VARCHAR(500) NOT NULL,
        device_type VARCHAR(50),
        device_info JSONB,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, fcm_token)
      );
    `);

    console.log('✅ user_device_tokens table created successfully!');

    // 인덱스 생성
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_user_device_tokens_user_id 
      ON user_device_tokens(user_id);
    `);

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_user_device_tokens_is_active 
      ON user_device_tokens(is_active);
    `);

    console.log('✅ Indexes created successfully!');

    // 테이블 확인
    const [result] = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_device_tokens'
      ORDER BY ordinal_position;
    `);

    console.log('\nTable structure:');
    console.table(result);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

createTable();
