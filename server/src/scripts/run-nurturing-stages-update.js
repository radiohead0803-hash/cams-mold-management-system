/**
 * 금형육성 단계 마스터 업데이트 마이그레이션
 * - 초도 T/O (금형제작처) 고정
 * - T/O 1차~n차 (제작처/협력사) 편집/추가 가능
 */
const { sequelize } = require('../models/newIndex');

async function run() {
  try {
    console.log('🚀 금형육성 단계 마스터 업데이트 시작...\n');

    // 1. 컬럼 추가
    console.log('1️⃣ 컬럼 추가...');
    await sequelize.query('ALTER TABLE mold_nurturing_stages ADD COLUMN IF NOT EXISTS is_fixed BOOLEAN DEFAULT FALSE');
    await sequelize.query('ALTER TABLE mold_nurturing_stages ADD COLUMN IF NOT EXISTS responsible_type VARCHAR(50)');
    await sequelize.query('ALTER TABLE mold_nurturing_stages ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE');
    await sequelize.query('ALTER TABLE mold_nurturing_stages ADD COLUMN IF NOT EXISTS mold_id BIGINT');
    console.log('   ✅ 컬럼 추가 완료');

    // 2. 기존 데이터 삭제
    console.log('\n2️⃣ 기존 데이터 삭제...');
    await sequelize.query('DELETE FROM mold_nurturing_stages');
    console.log('   ✅ 기존 데이터 삭제 완료');

    // 3. 새 데이터 삽입
    console.log('\n3️⃣ 새 육성 단계 데이터 삽입...');
    const stages = [
      { code: 'INITIAL_TO', name: '초도 T/O', order: 1, desc: '금형제작처에서 진행하는 초도 트라이아웃', is_fixed: true, responsible: 'maker' },
      { code: 'TO_1', name: 'T/O 1차', order: 2, desc: '제작처/협력사 1차 트라이아웃', is_fixed: false, responsible: 'maker' },
      { code: 'TO_2', name: 'T/O 2차', order: 3, desc: '제작처/협력사 2차 트라이아웃', is_fixed: false, responsible: 'maker' },
      { code: 'TO_3', name: 'T/O 3차', order: 4, desc: '제작처/협력사 3차 트라이아웃', is_fixed: false, responsible: 'maker' },
      { code: 'INITIAL_PRODUCTION', name: '초기 양산', order: 5, desc: 'SOP 후 3개월 이내 초기 양산 단계', is_fixed: false, responsible: 'plant' },
      { code: 'STABILIZATION', name: '양산 안정화', order: 6, desc: '양산 안정화 단계', is_fixed: false, responsible: 'plant' }
    ];

    for (const stage of stages) {
      await sequelize.query(`
        INSERT INTO mold_nurturing_stages (stage_code, stage_name, stage_order, description, is_active, is_fixed, responsible_type, is_custom)
        VALUES (:code, :name, :order, :desc, TRUE, :is_fixed, :responsible, FALSE)
      `, { replacements: stage });
      console.log(`   ✅ ${stage.name} 추가 완료 ${stage.is_fixed ? '(고정)' : ''}`);
    }

    // 4. 문제점 테이블 컬럼 추가
    console.log('\n4️⃣ 문제점 테이블 공통 조건필드 추가...');
    const columns = [
      { name: 'try_location', type: 'VARCHAR(100)', comment: 'T/O 장소' },
      { name: 'try_date', type: 'DATE', comment: 'T/O 일자' },
      { name: 'try_machine', type: 'VARCHAR(100)', comment: 'T/O 설비/사출기' },
      { name: 'try_material', type: 'VARCHAR(100)', comment: 'T/O 원재료' },
      { name: 'try_conditions', type: 'JSONB', comment: 'T/O 조건 (사출조건 등)' },
      { name: 'shot_count', type: 'INTEGER', comment: '숏수' },
      { name: 'cycle_time', type: 'DECIMAL(10,2)', comment: '사이클타임 (초)' },
      { name: 'responsible_company_id', type: 'BIGINT', comment: '담당 업체 ID' },
      { name: 'responsible_company_name', type: 'VARCHAR(200)', comment: '담당 업체명' }
    ];

    for (const col of columns) {
      await sequelize.query(`ALTER TABLE mold_nurturing_problems ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}`);
      console.log(`   ✅ ${col.name} 추가 완료`);
    }

    // 5. 인덱스 추가
    console.log('\n5️⃣ 인덱스 추가...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_mold_nurturing_stages_mold ON mold_nurturing_stages(mold_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_mold_nurturing_stages_fixed ON mold_nurturing_stages(is_fixed)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_mold_nurturing_stages_custom ON mold_nurturing_stages(is_custom)');
    console.log('   ✅ 인덱스 추가 완료');

    // 결과 확인
    console.log('\n✅ 마이그레이션 완료!\n');
    const [result] = await sequelize.query('SELECT stage_code, stage_name, is_fixed, responsible_type FROM mold_nurturing_stages ORDER BY stage_order');
    console.log('📊 육성 단계 목록:');
    result.forEach(s => {
      console.log(`   - ${s.stage_name} (${s.stage_code}) ${s.is_fixed ? '[고정]' : ''} - ${s.responsible_type === 'maker' ? '제작처' : '생산처'}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

run();
