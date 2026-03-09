/**
 * 수리요청 단계별 임시저장/승인 시스템 DB 마이그레이션
 * 
 * 7단계 워크플로우:
 *   1. 요청접수 (Plant)
 *   2. 수리처선정 (Plant → 개발담당자 승인)
 *   3. 수리진행 (Maker)
 *   4. 체크리스트 (Maker)
 *   5. 생산처검수 (Plant)
 *   6. 귀책처리 (개발담당자)
 *   7. 완료
 * 
 * 각 단계별: 임시저장 → 제출 → 승인요청 → 승인/반려
 */

const { Sequelize } = require('sequelize');
const DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const sequelize = new Sequelize(DB_URL, { logging: false });

async function migrate() {
  const t = await sequelize.transaction();
  
  try {
    // 1. repair_step_drafts - 단계별 임시저장
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS repair_step_drafts (
        id SERIAL PRIMARY KEY,
        repair_request_id INTEGER NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 7),
        step_name VARCHAR(50) NOT NULL,
        draft_data JSONB NOT NULL DEFAULT '{}',
        saved_by INTEGER REFERENCES users(id),
        saved_by_name VARCHAR(100),
        is_submitted BOOLEAN DEFAULT FALSE,
        submitted_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(repair_request_id, step_number)
      )
    `, { transaction: t });
    console.log('✅ repair_step_drafts 테이블 생성 완료');

    // 2. repair_step_approvals - 단계별 승인
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS repair_step_approvals (
        id SERIAL PRIMARY KEY,
        repair_request_id INTEGER NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
        step_number INTEGER NOT NULL CHECK (step_number BETWEEN 1 AND 7),
        step_name VARCHAR(50) NOT NULL,
        approval_status VARCHAR(20) NOT NULL DEFAULT 'pending'
          CHECK (approval_status IN ('pending', 'requested', 'approved', 'rejected')),
        requested_by INTEGER REFERENCES users(id),
        requested_by_name VARCHAR(100),
        requested_at TIMESTAMP,
        approver_id INTEGER REFERENCES users(id),
        approver_name VARCHAR(100),
        approved_at TIMESTAMP,
        rejection_reason TEXT,
        approval_notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(repair_request_id, step_number)
      )
    `, { transaction: t });
    console.log('✅ repair_step_approvals 테이블 생성 완료');

    // 3. repair_workflow_history - 워크플로우 이력
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS repair_workflow_history (
        id SERIAL PRIMARY KEY,
        repair_request_id INTEGER NOT NULL REFERENCES repair_requests(id) ON DELETE CASCADE,
        step_number INTEGER,
        step_name VARCHAR(50),
        action VARCHAR(50) NOT NULL,
        status VARCHAR(50),
        user_id INTEGER REFERENCES users(id),
        user_name VARCHAR(100),
        user_type VARCHAR(30),
        comment TEXT,
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      )
    `, { transaction: t });
    console.log('✅ repair_workflow_history 테이블 생성 완료');

    // 4. repair_requests에 current_step 컬럼 추가 (없으면)
    await sequelize.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'repair_requests' AND column_name = 'current_step'
        ) THEN
          ALTER TABLE repair_requests ADD COLUMN current_step INTEGER DEFAULT 1;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'repair_requests' AND column_name = 'current_step_name'
        ) THEN
          ALTER TABLE repair_requests ADD COLUMN current_step_name VARCHAR(50) DEFAULT '요청접수';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'repair_requests' AND column_name = 'current_step_status'
        ) THEN
          ALTER TABLE repair_requests ADD COLUMN current_step_status VARCHAR(20) DEFAULT 'draft';
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'repair_requests' AND column_name = 'mold_spec_id'
        ) THEN
          ALTER TABLE repair_requests ADD COLUMN mold_spec_id INTEGER;
        END IF;
        
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name = 'repair_requests' AND column_name = 'requester_company_id'
        ) THEN
          ALTER TABLE repair_requests ADD COLUMN requester_company_id INTEGER;
        END IF;
      END $$;
    `, { transaction: t });
    console.log('✅ repair_requests에 current_step 관련 컬럼 추가 완료');

    // 5. 인덱스 생성
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_repair_step_drafts_request 
        ON repair_step_drafts(repair_request_id);
      CREATE INDEX IF NOT EXISTS idx_repair_step_approvals_request 
        ON repair_step_approvals(repair_request_id);
      CREATE INDEX IF NOT EXISTS idx_repair_step_approvals_status 
        ON repair_step_approvals(approval_status);
      CREATE INDEX IF NOT EXISTS idx_repair_workflow_history_request 
        ON repair_workflow_history(repair_request_id);
      CREATE INDEX IF NOT EXISTS idx_repair_requests_current_step 
        ON repair_requests(current_step);
      CREATE INDEX IF NOT EXISTS idx_repair_requests_mold_spec 
        ON repair_requests(mold_spec_id);
    `, { transaction: t });
    console.log('✅ 인덱스 생성 완료');

    await t.commit();
    console.log('\n🎉 마이그레이션 완료!');

    // 결과 확인
    const [tables] = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'repair_%'
      ORDER BY table_name
    `);
    console.log('\n=== repair 관련 테이블 ===');
    tables.forEach(t => console.log(`  ✅ ${t.table_name}`));

  } catch (error) {
    await t.rollback();
    console.error('❌ 마이그레이션 실패:', error.message);
  } finally {
    await sequelize.close();
  }
}

migrate();
