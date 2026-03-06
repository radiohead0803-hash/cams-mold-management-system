const { sequelize } = require('./src/models');

async function createDraftsTable() {
  try {
    await sequelize.authenticate();
    console.log('DB 연결 성공');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS drafts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        draft_key VARCHAR(100) NOT NULL,
        draft_id VARCHAR(100) NOT NULL,
        data JSONB NOT NULL DEFAULT '{}',
        expires_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, draft_key, draft_id)
      );
    `);
    console.log('drafts 테이블 생성 완료');

    await sequelize.query(`CREATE INDEX IF NOT EXISTS idx_drafts_user_key ON drafts(user_id, draft_key);`);
    console.log('인덱스 생성 완료');

    process.exit(0);
  } catch (error) {
    console.error('테이블 생성 실패:', error);
    process.exit(1);
  }
}

createDraftsTable();
