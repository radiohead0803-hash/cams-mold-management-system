/**
 * 금형육성 문제점 샘플 데이터 마이그레이션 스크립트
 * 시스템에 등록된 모든 금형에 대해 각 3개씩 문제점 데이터 추가
 */
require('dotenv').config();
const { Sequelize } = require('sequelize');

// Railway DB 직접 연결
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

async function runMigration() {
  try {
    console.log('Starting nurturing problems sample data migration...');
    
    // 먼저 금형 목록 조회
    const [molds] = await sequelize.query(`
      SELECT id, mold_id, mold_code, part_name, part_number 
      FROM mold_specifications 
      ORDER BY id
    `);
    
    console.log(`Found ${molds.length} molds in the system`);
    
    if (molds.length === 0) {
      console.log('No molds found. Exiting.');
      process.exit(0);
    }
    
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    let problemCount = 0;
    
    // 기존 문제점 개수 확인
    const [[{ existing_count }]] = await sequelize.query(`
      SELECT COUNT(*) as existing_count FROM mold_nurturing_problems
    `);
    console.log(`Existing problems count: ${existing_count}`);
    
    for (const mold of molds) {
      const moldId = mold.mold_id || mold.id;
      const moldSpecId = mold.id;
      const partName = mold.part_name || mold.mold_code || '제품';
      
      // 문제점 1: TRY 1차 - 외관 문제 (Minor) - 종결됨
      problemCount++;
      const problemNum1 = `MNP-${today}-${String(problemCount).padStart(3, '0')}`;
      
      await sequelize.query(`
        INSERT INTO mold_nurturing_problems (
          problem_number, mold_id, mold_spec_id, nurturing_stage,
          occurrence_date, discovered_by, problem_types, problem_summary,
          problem_detail, occurrence_location, severity,
          cause_types, cause_detail, recurrence_risk,
          improvement_required, improvement_action, action_responsible,
          improvement_methods, planned_completion_date,
          action_status, verification_stage, result_description,
          is_recurred, final_judgment, status,
          created_by, created_by_name, created_at, updated_at
        ) VALUES (
          :problem_number, :mold_id, :mold_spec_id, 'TRY_1',
          CURRENT_DATE - INTERVAL '30 days', 'maker', '["외관"]'::JSONB,
          :problem_summary,
          '게이트 반대편 합류부에서 웰드라인이 발생하여 외관 품질 저하. 특히 조명 조건에서 육안으로 확인됨.',
          '게이트 반대편 합류부', 'minor',
          '["사출조건", "설계"]'::JSONB,
          '수지 온도 및 금형 온도가 낮아 합류부에서 융착 불량 발생.',
          'medium',
          TRUE, '1. 수지 온도 10°C 상향 조정\\n2. 금형 온도 5°C 상향 조정\\n3. 사출 속도 조정',
          'maker', '["조건변경"]'::JSONB, CURRENT_DATE - INTERVAL '20 days',
          'completed', 'same_try', '수지 온도 및 금형 온도 조정 후 웰드라인 개선 확인.',
          FALSE, 'ok', 'closed',
          1, '시스템관리자', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '15 days'
        ) ON CONFLICT (problem_number) DO NOTHING
      `, {
        replacements: {
          problem_number: problemNum1,
          mold_id: moldId,
          mold_spec_id: moldSpecId,
          problem_summary: `웰드라인 발생 - ${partName}`
        }
      });
      
      // 문제점 2: TRY 2차 - 치수 문제 (Major) - 검증중
      problemCount++;
      const problemNum2 = `MNP-${today}-${String(problemCount).padStart(3, '0')}`;
      
      await sequelize.query(`
        INSERT INTO mold_nurturing_problems (
          problem_number, mold_id, mold_spec_id, nurturing_stage,
          occurrence_date, discovered_by, problem_types, problem_summary,
          problem_detail, occurrence_location, severity,
          cause_types, cause_detail, recurrence_risk,
          improvement_required, improvement_action, action_responsible,
          improvement_methods, planned_completion_date,
          action_status, verification_stage, is_recurred, status,
          created_by, created_by_name, created_at, updated_at
        ) VALUES (
          :problem_number, :mold_id, :mold_spec_id, 'TRY_2',
          CURRENT_DATE - INTERVAL '15 days', 'mold_developer', '["치수"]'::JSONB,
          :problem_summary,
          '상대물 조립부 치수가 도면 공차 상한을 0.15mm 초과. 조립 시 간섭 발생 우려.',
          '조립부 보스 홀', 'major',
          '["가공", "설계"]'::JSONB,
          '수축률 적용 오류로 인한 치수 편차 발생.',
          'high',
          TRUE, '1. 코어 재가공 (0.2mm 축소)\\n2. 수축률 재계산 및 적용\\n3. 3차원 측정 검증',
          'maker', '["금형수정"]'::JSONB, CURRENT_DATE - INTERVAL '5 days',
          'completed', 'next_try', FALSE, 'verifying',
          1, '시스템관리자', CURRENT_DATE - INTERVAL '15 days', CURRENT_DATE - INTERVAL '3 days'
        ) ON CONFLICT (problem_number) DO NOTHING
      `, {
        replacements: {
          problem_number: problemNum2,
          mold_id: moldId,
          mold_spec_id: moldSpecId,
          problem_summary: `조립부 치수 공차 초과 - ${partName}`
        }
      });
      
      // 문제점 3: 초기양산 - 취출 문제 (Critical) - 분석중
      problemCount++;
      const problemNum3 = `MNP-${today}-${String(problemCount).padStart(3, '0')}`;
      
      await sequelize.query(`
        INSERT INTO mold_nurturing_problems (
          problem_number, mold_id, mold_spec_id, nurturing_stage,
          occurrence_date, discovered_by, problem_types, problem_summary,
          problem_detail, occurrence_location, severity,
          cause_types, cause_detail, recurrence_risk,
          improvement_required, improvement_action, action_responsible,
          improvement_methods, planned_completion_date,
          action_status, status,
          created_by, created_by_name, created_at, updated_at
        ) VALUES (
          :problem_number, :mold_id, :mold_spec_id, 'INITIAL_PRODUCTION',
          CURRENT_DATE - INTERVAL '5 days', 'plant', '["취출", "외관"]'::JSONB,
          :problem_summary,
          '연속 생산 시 이젝터 핀 자국이 심하게 발생하고, 간헐적으로 취출 시 제품 변형 발생.',
          '이젝터 핀 위치 (하면부)', 'critical',
          '["설계", "관리 미흡"]'::JSONB,
          '이젝터 핀 직경 및 위치 부적합. 냉각 시간 부족.',
          'high',
          TRUE, '1. 이젝터 핀 직경 확대\\n2. 이젝터 핀 추가\\n3. 냉각 시간 연장',
          'maker', '["금형수정", "조건변경"]'::JSONB, CURRENT_DATE + INTERVAL '7 days',
          'not_started', 'analyzing',
          1, '시스템관리자', CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE
        ) ON CONFLICT (problem_number) DO NOTHING
      `, {
        replacements: {
          problem_number: problemNum3,
          mold_id: moldId,
          mold_spec_id: moldSpecId,
          problem_summary: `이젝터 핀 자국 및 취출 불량 - ${partName}`
        }
      });
      
      console.log(`Added 3 problems for mold: ${mold.mold_code || mold.mold_name} (ID: ${moldSpecId})`);
    }
    
    // 결과 확인
    const [[{ total_count }]] = await sequelize.query(`
      SELECT COUNT(*) as total_count FROM mold_nurturing_problems
    `);
    
    console.log('\\n=== Migration Complete ===');
    console.log(`Total molds processed: ${molds.length}`);
    console.log(`Problems created: ${problemCount}`);
    console.log(`Total problems in DB: ${total_count}`);
    
    // 금형별 문제점 수 확인
    const [summary] = await sequelize.query(`
      SELECT 
        ms.mold_code,
        ms.part_name,
        COUNT(mnp.id) as problem_count
      FROM mold_specifications ms
      LEFT JOIN mold_nurturing_problems mnp ON ms.id = mnp.mold_spec_id
      GROUP BY ms.id, ms.mold_code, ms.part_name
      ORDER BY ms.id
      LIMIT 10
    `);
    
    console.log('\\n=== Sample Results (first 10) ===');
    summary.forEach(row => {
      console.log(`${row.mold_code || 'N/A'} - ${row.part_name || 'N/A'}: ${row.problem_count} problems`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
