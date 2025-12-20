/**
 * 금형육성 문제점 관리 마이그레이션 실행 스크립트
 */
const { sequelize } = require('../models/newIndex');

async function runMigration() {
  try {
    console.log('🚀 금형육성 문제점 관리 마이그레이션 시작...\n');

    // 1. 메인 테이블 생성
    console.log('1️⃣ mold_nurturing_problems 테이블 생성...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mold_nurturing_problems (
        id SERIAL PRIMARY KEY,
        problem_number VARCHAR(50) UNIQUE,
        mold_id BIGINT NOT NULL,
        mold_spec_id BIGINT,
        nurturing_stage VARCHAR(30) NOT NULL,
        occurrence_date DATE NOT NULL,
        discovered_by VARCHAR(30) NOT NULL,
        problem_types JSONB,
        problem_summary VARCHAR(500) NOT NULL,
        problem_detail TEXT,
        occurrence_location VARCHAR(500),
        location_image_url VARCHAR(500),
        severity VARCHAR(20) NOT NULL DEFAULT 'minor',
        cause_types JSONB,
        cause_detail TEXT,
        recurrence_risk VARCHAR(20),
        improvement_required BOOLEAN DEFAULT TRUE,
        improvement_action TEXT,
        action_responsible VARCHAR(30),
        improvement_methods JSONB,
        planned_completion_date DATE,
        action_status VARCHAR(30) DEFAULT 'not_started',
        verification_stage VARCHAR(30),
        result_description TEXT,
        is_recurred BOOLEAN DEFAULT FALSE,
        final_judgment VARCHAR(30),
        status VARCHAR(30) NOT NULL DEFAULT 'registered',
        occurrence_photos JSONB,
        before_after_photos JSONB,
        related_documents JSONB,
        created_by BIGINT,
        created_by_name VARCHAR(100),
        updated_by BIGINT,
        updated_by_name VARCHAR(100),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ mold_nurturing_problems 테이블 생성 완료');

    // 2. 이력 테이블 생성
    console.log('\n2️⃣ mold_nurturing_problem_histories 테이블 생성...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mold_nurturing_problem_histories (
        id SERIAL PRIMARY KEY,
        problem_id BIGINT NOT NULL,
        action_type VARCHAR(30) NOT NULL,
        previous_status VARCHAR(30),
        new_status VARCHAR(30),
        changed_fields JSONB,
        change_description TEXT,
        changed_by BIGINT,
        changed_by_name VARCHAR(100),
        changed_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ mold_nurturing_problem_histories 테이블 생성 완료');

    // 3. 코멘트 테이블 생성
    console.log('\n3️⃣ mold_nurturing_problem_comments 테이블 생성...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mold_nurturing_problem_comments (
        id SERIAL PRIMARY KEY,
        problem_id BIGINT NOT NULL,
        comment_text TEXT NOT NULL,
        attachments JSONB,
        created_by BIGINT,
        created_by_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ mold_nurturing_problem_comments 테이블 생성 완료');

    // 4. 육성 단계 마스터 테이블
    console.log('\n4️⃣ mold_nurturing_stages 테이블 생성...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS mold_nurturing_stages (
        id SERIAL PRIMARY KEY,
        stage_code VARCHAR(30) NOT NULL UNIQUE,
        stage_name VARCHAR(100) NOT NULL,
        stage_order INTEGER NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    console.log('   ✅ mold_nurturing_stages 테이블 생성 완료');

    // 5. 기본 육성 단계 데이터 삽입
    console.log('\n5️⃣ 기본 육성 단계 데이터 삽입...');
    const stages = [
      { code: 'TRY_1', name: 'TRY 1차', order: 1, desc: '1차 트라이아웃' },
      { code: 'TRY_2', name: 'TRY 2차', order: 2, desc: '2차 트라이아웃' },
      { code: 'TRY_3', name: 'TRY 3차', order: 3, desc: '3차 트라이아웃' },
      { code: 'INITIAL_PRODUCTION', name: '초기 양산 (SOP-3개월)', order: 4, desc: 'SOP 후 3개월 이내 초기 양산 단계' },
      { code: 'STABILIZATION', name: '양산 안정화', order: 5, desc: '양산 안정화 단계' }
    ];
    
    for (const stage of stages) {
      try {
        const [existing] = await sequelize.query(
          `SELECT id FROM mold_nurturing_stages WHERE stage_code = :code`,
          { replacements: { code: stage.code } }
        );
        if (existing.length === 0) {
          await sequelize.query(`
            INSERT INTO mold_nurturing_stages (stage_code, stage_name, stage_order, description)
            VALUES (:code, :name, :order, :desc)
          `, { replacements: stage });
          console.log(`   ✅ ${stage.name} 추가 완료`);
        } else {
          console.log(`   ⏭️ ${stage.name} 이미 존재`);
        }
      } catch (err) {
        console.log(`   ⚠️ ${stage.name}: ${err.message}`);
      }
    }

    // 6. 인덱스 생성
    console.log('\n6️⃣ 인덱스 생성...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_mnp_mold ON mold_nurturing_problems(mold_id)',
      'CREATE INDEX IF NOT EXISTS idx_mnp_stage ON mold_nurturing_problems(nurturing_stage)',
      'CREATE INDEX IF NOT EXISTS idx_mnp_status ON mold_nurturing_problems(status)',
      'CREATE INDEX IF NOT EXISTS idx_mnp_severity ON mold_nurturing_problems(severity)',
      'CREATE INDEX IF NOT EXISTS idx_mnp_recurred ON mold_nurturing_problems(is_recurred)',
      'CREATE INDEX IF NOT EXISTS idx_mnp_created ON mold_nurturing_problems(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_mnph_problem ON mold_nurturing_problem_histories(problem_id)',
      'CREATE INDEX IF NOT EXISTS idx_mnpc_problem ON mold_nurturing_problem_comments(problem_id)'
    ];
    
    for (const idx of indexes) {
      try {
        await sequelize.query(idx);
        const name = idx.match(/idx_\w+/)?.[0] || 'index';
        console.log(`   ✅ ${name} 생성 완료`);
      } catch (err) {
        console.log(`   ⚠️ ${err.message}`);
      }
    }

    console.log('\n✅ 마이그레이션 완료!\n');
    
    // 결과 확인
    const [tables] = await sequelize.query(`
      SELECT table_name FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name LIKE 'mold_nurturing%'
    `);
    console.log('📊 생성된 테이블:', tables.map(t => t.table_name).join(', '));

    process.exit(0);
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

runMigration();
