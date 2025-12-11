/**
 * Railway DB 누락 테이블 생성 스크립트
 */

const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function createMissingTables() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Railway DB 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    const tables = [
      {
        name: 'stage_change_history',
        sql: `CREATE TABLE IF NOT EXISTS stage_change_history (
          id SERIAL PRIMARY KEY,
          mold_id INTEGER,
          previous_stage VARCHAR(20),
          new_stage VARCHAR(20),
          change_type VARCHAR(20),
          reason TEXT,
          changed_by INTEGER,
          changed_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'mold_development',
        sql: `CREATE TABLE IF NOT EXISTS mold_development (
          id SERIAL PRIMARY KEY,
          mold_id INTEGER,
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
        )`
      },
      {
        name: 'mold_development_plans',
        sql: `CREATE TABLE IF NOT EXISTS mold_development_plans (
          id SERIAL PRIMARY KEY,
          mold_specification_id INTEGER,
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
          created_by INTEGER,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'mold_process_steps',
        sql: `CREATE TABLE IF NOT EXISTS mold_process_steps (
          id SERIAL PRIMARY KEY,
          development_plan_id INTEGER,
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
        )`
      },
      {
        name: 'pre_production_checklists',
        sql: `CREATE TABLE IF NOT EXISTS pre_production_checklists (
          id SERIAL PRIMARY KEY,
          mold_specification_id INTEGER,
          maker_id INTEGER,
          checklist_id VARCHAR(50),
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
          created_by_maker INTEGER,
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
          reviewed_by INTEGER,
          reviewed_by_name VARCHAR(100),
          reviewed_at TIMESTAMP,
          review_comments TEXT,
          required_corrections JSONB,
          production_approved BOOLEAN DEFAULT FALSE,
          production_start_date DATE,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'daily_check_item_status',
        sql: `CREATE TABLE IF NOT EXISTS daily_check_item_status (
          id SERIAL PRIMARY KEY,
          daily_check_id INTEGER,
          item_id INTEGER NOT NULL,
          status VARCHAR(20) NOT NULL,
          notes TEXT,
          cleaning_agent VARCHAR(50),
          photo_refs JSONB,
          issue_id INTEGER,
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'inspection_photos',
        sql: `CREATE TABLE IF NOT EXISTS inspection_photos (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          mold_id INTEGER,
          checklist_id INTEGER,
          item_status_id INTEGER,
          file_url VARCHAR(500) NOT NULL,
          thumbnail_url VARCHAR(500),
          file_type VARCHAR(50),
          uploaded_by INTEGER,
          shot_count INTEGER,
          metadata JSONB,
          uploaded_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'mold_issues',
        sql: `CREATE TABLE IF NOT EXISTS mold_issues (
          id SERIAL PRIMARY KEY,
          mold_id INTEGER,
          issue_type VARCHAR(50),
          severity VARCHAR(20),
          description TEXT,
          status VARCHAR(20) DEFAULT 'open',
          reported_by INTEGER,
          assigned_to INTEGER,
          resolved_by INTEGER,
          resolved_at TIMESTAMP,
          resolution TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'scrapping_requests',
        sql: `CREATE TABLE IF NOT EXISTS scrapping_requests (
          id SERIAL PRIMARY KEY,
          mold_id INTEGER,
          request_number VARCHAR(50),
          reason TEXT,
          requested_by INTEGER,
          requested_at TIMESTAMP DEFAULT NOW(),
          status VARCHAR(20) DEFAULT 'pending',
          approved_by INTEGER,
          approved_at TIMESTAMP,
          rejection_reason TEXT,
          scrapped_at TIMESTAMP,
          notes TEXT,
          attachments JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'repair_requests',
        sql: `CREATE TABLE IF NOT EXISTS repair_requests (
          id SERIAL PRIMARY KEY,
          mold_id INTEGER,
          request_number VARCHAR(50),
          repair_type VARCHAR(50),
          priority VARCHAR(20) DEFAULT 'normal',
          description TEXT,
          requested_by INTEGER,
          requested_at TIMESTAMP DEFAULT NOW(),
          status VARCHAR(20) DEFAULT 'pending',
          assigned_to INTEGER,
          estimated_cost DECIMAL(12, 2),
          actual_cost DECIMAL(12, 2),
          estimated_completion DATE,
          actual_completion DATE,
          repair_notes TEXT,
          attachments JSONB,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'liability_discussions',
        sql: `CREATE TABLE IF NOT EXISTS liability_discussions (
          id SERIAL PRIMARY KEY,
          repair_request_id INTEGER,
          mold_id INTEGER,
          discussion_status VARCHAR(20) DEFAULT 'pending',
          maker_opinion TEXT,
          plant_opinion TEXT,
          hq_decision TEXT,
          liability_party VARCHAR(50),
          cost_allocation JSONB,
          decided_by INTEGER,
          decided_at TIMESTAMP,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'check_item_master',
        sql: `CREATE TABLE IF NOT EXISTS check_item_master (
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
        )`
      },
      {
        name: 'check_guide_materials',
        sql: `CREATE TABLE IF NOT EXISTS check_guide_materials (
          id SERIAL PRIMARY KEY,
          check_item_id INTEGER,
          material_type VARCHAR(50),
          title VARCHAR(200),
          file_url VARCHAR(500),
          description TEXT,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'system_settings',
        sql: `CREATE TABLE IF NOT EXISTS system_settings (
          id SERIAL PRIMARY KEY,
          setting_key VARCHAR(100) UNIQUE NOT NULL,
          setting_value TEXT,
          setting_type VARCHAR(50),
          description TEXT,
          updated_by INTEGER,
          updated_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'audit_logs',
        sql: `CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id INTEGER,
          action VARCHAR(100) NOT NULL,
          entity_type VARCHAR(100),
          entity_id INTEGER,
          old_values JSONB,
          new_values JSONB,
          ip_address VARCHAR(45),
          user_agent TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )`
      },
      {
        name: 'file_attachments',
        sql: `CREATE TABLE IF NOT EXISTS file_attachments (
          id SERIAL PRIMARY KEY,
          entity_type VARCHAR(100) NOT NULL,
          entity_id INTEGER NOT NULL,
          file_name VARCHAR(255) NOT NULL,
          file_url VARCHAR(500) NOT NULL,
          file_type VARCHAR(50),
          file_size INTEGER,
          uploaded_by INTEGER,
          uploaded_at TIMESTAMP DEFAULT NOW()
        )`
      }
    ];

    console.log('📄 누락된 테이블 생성 중...\n');

    let created = 0;
    let skipped = 0;

    for (const table of tables) {
      try {
        // 테이블 존재 여부 확인
        const exists = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = $1
          )
        `, [table.name]);

        if (exists.rows[0].exists) {
          console.log(`  ⏭️ ${table.name} (이미 존재)`);
          skipped++;
        } else {
          await client.query(table.sql);
          console.log(`  ✅ ${table.name} 생성됨`);
          created++;
        }
      } catch (err) {
        console.error(`  ❌ ${table.name}: ${err.message}`);
      }
    }

    console.log('\n========================================');
    console.log(`✅ 테이블 생성 완료!`);
    console.log(`   새로 생성: ${created}개`);
    console.log(`   이미 존재: ${skipped}개`);
    console.log('========================================\n');

    // 최종 테이블 수 확인
    const result = await client.query(`
      SELECT COUNT(*) as count FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log(`📊 현재 총 테이블 수: ${result.rows[0].count}개`);

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 DB 연결 종료');
  }
}

createMissingTables();
