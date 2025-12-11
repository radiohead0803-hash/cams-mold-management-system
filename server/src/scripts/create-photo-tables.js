/**
 * 사진/파일 업로드 관련 테이블 생성 및 확인 스크립트
 */

const { Client } = require('pg');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function createPhotoTables() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    const tables = [
      {
        name: 'inspection_photos',
        description: '점검 사진/문서 저장',
        sql: `
          DROP TABLE IF EXISTS inspection_photos CASCADE;
          CREATE TABLE inspection_photos (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            mold_id INTEGER,
            checklist_id INTEGER,
            checklist_type VARCHAR(50),
            item_id INTEGER,
            category VARCHAR(100),
            file_name VARCHAR(255) NOT NULL,
            original_name VARCHAR(255),
            file_url VARCHAR(500) NOT NULL,
            thumbnail_url VARCHAR(500),
            file_type VARCHAR(50),
            file_size INTEGER,
            mime_type VARCHAR(100),
            uploaded_by INTEGER,
            shot_count INTEGER,
            description TEXT,
            metadata JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            uploaded_at TIMESTAMP DEFAULT NOW(),
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX idx_inspection_photos_mold ON inspection_photos(mold_id);
          CREATE INDEX idx_inspection_photos_checklist ON inspection_photos(checklist_id);
          CREATE INDEX idx_inspection_photos_type ON inspection_photos(checklist_type);
        `
      },
      {
        name: 'mold_photos',
        description: '금형 사진 (상형/하형/전체)',
        sql: `
          CREATE TABLE IF NOT EXISTS mold_photos (
            id SERIAL PRIMARY KEY,
            mold_id INTEGER NOT NULL,
            photo_type VARCHAR(50) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            original_name VARCHAR(255),
            file_url VARCHAR(500) NOT NULL,
            thumbnail_url VARCHAR(500),
            file_size INTEGER,
            mime_type VARCHAR(100),
            description TEXT,
            uploaded_by INTEGER,
            is_primary BOOLEAN DEFAULT FALSE,
            display_order INTEGER DEFAULT 0,
            metadata JSONB,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_mold_photos_mold ON mold_photos(mold_id);
          CREATE INDEX IF NOT EXISTS idx_mold_photos_type ON mold_photos(photo_type);
        `
      },
      {
        name: 'tryout_issue_attachments',
        description: 'T/O 문제점 첨부파일',
        sql: `
          CREATE TABLE IF NOT EXISTS tryout_issue_attachments (
            id SERIAL PRIMARY KEY,
            issue_id INTEGER NOT NULL,
            attachment_type VARCHAR(50) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            original_name VARCHAR(255),
            file_url VARCHAR(500) NOT NULL,
            thumbnail_url VARCHAR(500),
            file_size INTEGER,
            mime_type VARCHAR(100),
            description TEXT,
            uploaded_by INTEGER,
            display_order INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_tryout_attachments_issue ON tryout_issue_attachments(issue_id);
        `
      },
      {
        name: 'repair_attachments',
        description: '수리 첨부파일',
        sql: `
          CREATE TABLE IF NOT EXISTS repair_attachments (
            id SERIAL PRIMARY KEY,
            repair_id INTEGER,
            repair_request_id INTEGER,
            attachment_type VARCHAR(50) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            original_name VARCHAR(255),
            file_url VARCHAR(500) NOT NULL,
            thumbnail_url VARCHAR(500),
            file_size INTEGER,
            mime_type VARCHAR(100),
            description TEXT,
            uploaded_by INTEGER,
            stage VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_repair_attachments_repair ON repair_attachments(repair_id);
        `
      },
      {
        name: 'checklist_attachments',
        description: '체크리스트 첨부파일 (제작전, 양산이관 등)',
        sql: `
          CREATE TABLE IF NOT EXISTS checklist_attachments (
            id SERIAL PRIMARY KEY,
            checklist_id INTEGER NOT NULL,
            checklist_type VARCHAR(50) NOT NULL,
            item_id INTEGER,
            category VARCHAR(100),
            attachment_type VARCHAR(50) NOT NULL,
            file_name VARCHAR(255) NOT NULL,
            original_name VARCHAR(255),
            file_url VARCHAR(500) NOT NULL,
            thumbnail_url VARCHAR(500),
            file_size INTEGER,
            mime_type VARCHAR(100),
            description TEXT,
            uploaded_by INTEGER,
            is_required BOOLEAN DEFAULT FALSE,
            status VARCHAR(20) DEFAULT 'uploaded',
            created_at TIMESTAMP DEFAULT NOW()
          );
          CREATE INDEX IF NOT EXISTS idx_checklist_attachments_checklist ON checklist_attachments(checklist_id);
          CREATE INDEX IF NOT EXISTS idx_checklist_attachments_type ON checklist_attachments(checklist_type);
        `
      }
    ];

    console.log('📄 사진/파일 관련 테이블 생성 중...\n');

    for (const table of tables) {
      try {
        await client.query(table.sql);
        console.log(`  ✅ ${table.name} - ${table.description}`);
      } catch (err) {
        if (err.code === '42P07') {
          console.log(`  ⏭️ ${table.name} - 이미 존재`);
        } else {
          console.error(`  ❌ ${table.name}: ${err.message}`);
        }
      }
    }

    // 결과 확인
    console.log('\n📊 사진/파일 관련 테이블 현황:');
    const photoTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%photo%' OR table_name LIKE '%attachment%' OR table_name LIKE '%image%')
      ORDER BY table_name
    `);
    
    for (const row of photoTables.rows) {
      const count = await client.query(`SELECT COUNT(*) FROM "${row.table_name}"`);
      console.log(`  - ${row.table_name}: ${count.rows[0].count}개 레코드`);
    }

    console.log('\n========================================');
    console.log('✅ 사진/파일 테이블 생성 완료!');
    console.log('========================================');

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

createPhotoTables();
