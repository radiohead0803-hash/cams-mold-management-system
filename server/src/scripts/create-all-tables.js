/**
 * Railway DB 전체 테이블 생성 스크립트
 * 누락된 테이블을 생성하고 필요한 인덱스를 추가합니다.
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const createTablesSql = `
-- =====================================================
-- 누락된 테이블 생성 (DATABASE_SCHEMA.md 기준)
-- =====================================================

-- 1. stage_change_history (단계 변경 이력)
CREATE TABLE IF NOT EXISTS stage_change_history (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER REFERENCES molds(id),
  previous_stage VARCHAR(20),
  new_stage VARCHAR(20),
  change_type VARCHAR(20),
  reason TEXT,
  changed_by INTEGER REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stage_change_mold ON stage_change_history(mold_id);

-- 2. mold_development (금형개발 기본 정보)
CREATE TABLE IF NOT EXISTS mold_development (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER REFERENCES molds(id),
  development_type VARCHAR(50),
  development_stage VARCHAR(50),
  start_date DATE,
  target_date DATE,
  completion_date DATE,
  budget DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  responsible_person VARCHAR(100),
  overall_progress INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mold_development_mold ON mold_development(mold_id);

-- 3. mold_development_plans (금형개발계획 - 진도 관리)
CREATE TABLE IF NOT EXISTS mold_development_plans (
  id SERIAL PRIMARY KEY,
  mold_specification_id INTEGER REFERENCES mold_specifications(id),
  car_model VARCHAR(100),
  part_number VARCHAR(50),
  part_name VARCHAR(200),
  schedule_code VARCHAR(20),
  export_rate VARCHAR(20),
  raw_material VARCHAR(100),
  manufacturer VARCHAR(100),
  trial_order_date DATE,
  start_status BOOLEAN DEFAULT FALSE,
  completion_status BOOLEAN DEFAULT FALSE,
  material_upper_type VARCHAR(100),
  material_lower_type VARCHAR(100),
  part_weight DECIMAL(10, 2),
  images JSONB,
  overall_progress INTEGER DEFAULT 0,
  completed_steps INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 12,
  current_step VARCHAR(50),
  status VARCHAR(20),
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_development_plans_spec ON mold_development_plans(mold_specification_id);

-- 4. mold_process_steps (공정 단계 - 12단계 진도 관리)
CREATE TABLE IF NOT EXISTS mold_process_steps (
  id SERIAL PRIMARY KEY,
  development_plan_id INTEGER REFERENCES mold_development_plans(id),
  step_number INTEGER NOT NULL,
  step_name VARCHAR(100) NOT NULL,
  start_date DATE,
  planned_completion_date DATE,
  actual_completion_date DATE,
  status VARCHAR(20),
  status_display VARCHAR(50),
  notes TEXT,
  days_remaining VARCHAR(20),
  assignee VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_process_steps_plan ON mold_process_steps(development_plan_id);

-- 5. pre_production_checklists (제작전 체크리스트)
CREATE TABLE IF NOT EXISTS pre_production_checklists (
  id SERIAL PRIMARY KEY,
  mold_specification_id INTEGER REFERENCES mold_specifications(id),
  maker_id INTEGER REFERENCES users(id),
  checklist_id VARCHAR(50) UNIQUE,
  checklist_title VARCHAR(200),
  checklist_type VARCHAR(50) DEFAULT '제작전',
  total_items INTEGER DEFAULT 81,
  rejected_items INTEGER DEFAULT 0,
  progress_rate DECIMAL(5, 2) DEFAULT 0,
  status VARCHAR(20) DEFAULT '승인대기',
  car_model VARCHAR(100),
  part_number VARCHAR(50),
  part_name VARCHAR(200),
  created_date DATE,
  created_by_name VARCHAR(100),
  production_plant VARCHAR(100),
  maker_name VARCHAR(100),
  injection_machine_tonnage VARCHAR(50),
  clamping_force VARCHAR(50),
  eo_cut_date DATE,
  trial_order_date DATE,
  part_images JSONB,
  created_by_maker INTEGER REFERENCES users(id),
  category_material JSONB,
  category_mold JSONB,
  category_gas_vent JSONB,
  category_moldflow JSONB,
  category_sink_mark JSONB,
  category_ejection JSONB,
  category_mic JSONB,
  category_coating JSONB,
  category_rear_back_beam JSONB,
  ok_items INTEGER DEFAULT 0,
  ng_items INTEGER DEFAULT 0,
  na_items INTEGER DEFAULT 0,
  pass_rate DECIMAL(5, 2),
  overall_result VARCHAR(20),
  special_notes TEXT,
  risk_assessment TEXT,
  submitted BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMP,
  review_status VARCHAR(20) DEFAULT 'pending',
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_by_name VARCHAR(100),
  reviewed_at TIMESTAMP,
  review_comments TEXT,
  required_corrections JSONB,
  production_approved BOOLEAN DEFAULT FALSE,
  production_start_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pre_production_spec ON pre_production_checklists(mold_specification_id);
CREATE INDEX IF NOT EXISTS idx_pre_production_maker ON pre_production_checklists(maker_id);

-- 6. daily_check_item_status (일상점검 항목별 결과)
CREATE TABLE IF NOT EXISTS daily_check_item_status (
  id SERIAL PRIMARY KEY,
  daily_check_id INTEGER REFERENCES daily_checklist_items(id),
  item_id INTEGER NOT NULL,
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  cleaning_agent VARCHAR(50),
  photo_refs JSONB,
  issue_id INTEGER,
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_item_status_check ON daily_check_item_status(daily_check_id);

-- 7. inspection_photos (사진/문서 저장)
CREATE TABLE IF NOT EXISTS inspection_photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mold_id INTEGER REFERENCES molds(id),
  checklist_id INTEGER,
  item_status_id INTEGER,
  file_url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  file_type VARCHAR(50),
  uploaded_by INTEGER REFERENCES users(id),
  shot_count INTEGER,
  metadata JSONB,
  uploaded_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_inspection_photos_mold ON inspection_photos(mold_id);

-- 8. mold_issues (금형 이슈)
CREATE TABLE IF NOT EXISTS mold_issues (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER REFERENCES molds(id),
  issue_type VARCHAR(50),
  severity VARCHAR(20),
  description TEXT,
  status VARCHAR(20) DEFAULT 'open',
  reported_by INTEGER REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  resolved_by INTEGER REFERENCES users(id),
  resolved_at TIMESTAMP,
  resolution TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mold_issues_mold ON mold_issues(mold_id);
CREATE INDEX IF NOT EXISTS idx_mold_issues_status ON mold_issues(status);

-- 9. scrapping_requests (폐기 요청)
CREATE TABLE IF NOT EXISTS scrapping_requests (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER REFERENCES molds(id),
  request_number VARCHAR(50) UNIQUE,
  reason TEXT,
  requested_by INTEGER REFERENCES users(id),
  requested_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  approved_by INTEGER REFERENCES users(id),
  approved_at TIMESTAMP,
  rejection_reason TEXT,
  scrapped_at TIMESTAMP,
  notes TEXT,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_scrapping_mold ON scrapping_requests(mold_id);
CREATE INDEX IF NOT EXISTS idx_scrapping_status ON scrapping_requests(status);

-- 10. repair_requests (수리 요청)
CREATE TABLE IF NOT EXISTS repair_requests (
  id SERIAL PRIMARY KEY,
  mold_id INTEGER REFERENCES molds(id),
  request_number VARCHAR(50) UNIQUE,
  repair_type VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  description TEXT,
  requested_by INTEGER REFERENCES users(id),
  requested_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending',
  assigned_to INTEGER REFERENCES users(id),
  estimated_cost DECIMAL(12, 2),
  actual_cost DECIMAL(12, 2),
  estimated_completion DATE,
  actual_completion DATE,
  repair_notes TEXT,
  attachments JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_repair_requests_mold ON repair_requests(mold_id);
CREATE INDEX IF NOT EXISTS idx_repair_requests_status ON repair_requests(status);

-- 11. liability_discussions (귀책 협의)
CREATE TABLE IF NOT EXISTS liability_discussions (
  id SERIAL PRIMARY KEY,
  repair_request_id INTEGER REFERENCES repair_requests(id),
  mold_id INTEGER REFERENCES molds(id),
  discussion_status VARCHAR(20) DEFAULT 'pending',
  maker_opinion TEXT,
  plant_opinion TEXT,
  hq_decision TEXT,
  liability_party VARCHAR(50),
  cost_allocation JSONB,
  decided_by INTEGER REFERENCES users(id),
  decided_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_liability_repair ON liability_discussions(repair_request_id);

-- 12. check_item_master (점검 항목 마스터)
CREATE TABLE IF NOT EXISTS check_item_master (
  id SERIAL PRIMARY KEY,
  check_type VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  item_code VARCHAR(50),
  item_name VARCHAR(200) NOT NULL,
  description TEXT,
  inspection_method VARCHAR(100),
  acceptance_criteria TEXT,
  is_required BOOLEAN DEFAULT TRUE,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_check_item_type ON check_item_master(check_type);

-- 13. check_guide_materials (점검 가이드 자료)
CREATE TABLE IF NOT EXISTS check_guide_materials (
  id SERIAL PRIMARY KEY,
  check_item_id INTEGER REFERENCES check_item_master(id),
  material_type VARCHAR(50),
  title VARCHAR(200),
  file_url VARCHAR(500),
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_guide_materials_item ON check_guide_materials(check_item_id);

-- 14. system_settings (시스템 설정)
CREATE TABLE IF NOT EXISTS system_settings (
  id SERIAL PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT,
  setting_type VARCHAR(50),
  description TEXT,
  updated_by INTEGER REFERENCES users(id),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 15. audit_logs (감사 로그)
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100),
  entity_id INTEGER,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs(created_at);

-- 16. file_attachments (파일 첨부)
CREATE TABLE IF NOT EXISTS file_attachments (
  id SERIAL PRIMARY KEY,
  entity_type VARCHAR(100) NOT NULL,
  entity_id INTEGER NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  file_url VARCHAR(500) NOT NULL,
  file_type VARCHAR(50),
  file_size INTEGER,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_file_attachments_entity ON file_attachments(entity_type, entity_id);
`;

async function createAllTables() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    console.log('📄 누락된 테이블 생성 중...');
    
    // SQL 문장 분리 및 실행
    const statements = createTablesSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    let successCount = 0;
    let skipCount = 0;

    for (const statement of statements) {
      try {
        await client.query(statement);
        successCount++;
        
        // CREATE TABLE 문인 경우 테이블명 출력
        const tableMatch = statement.match(/CREATE TABLE IF NOT EXISTS (\w+)/i);
        if (tableMatch) {
          console.log(`  ✅ ${tableMatch[1]}`);
        }
      } catch (err) {
        if (err.code === '42P07') {
          skipCount++;
        } else if (err.code === '42P01') {
          // 참조 테이블이 없는 경우
          console.log(`  ⚠️ 참조 테이블 없음: ${statement.substring(0, 50)}...`);
        } else {
          console.error(`  ❌ 오류: ${err.message}`);
        }
      }
    }

    console.log('\n========================================');
    console.log(`✅ 테이블 생성 완료!`);
    console.log(`   성공: ${successCount}개`);
    console.log(`   건너뜀: ${skipCount}개`);
    console.log('========================================\n');

    // 최종 테이블 수 확인
    const result = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`📊 현재 총 테이블 수: ${result.rows[0].count}개`);

    // 새로 생성된 테이블 확인
    const newTables = await client.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('\n📋 전체 테이블 목록:');
    newTables.rows.forEach((row, i) => {
      console.log(`  ${(i+1).toString().padStart(2)}. ${row.table_name}`);
    });

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

createAllTables();
