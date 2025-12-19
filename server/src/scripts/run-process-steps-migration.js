/**
 * 금형개발계획 추진계획 항목 마이그레이션 실행 스크립트
 * - mold_process_steps 테이블에 새 컬럼 추가
 * - mold_process_step_masters 테이블 생성
 * - 기본 14단계 데이터 삽입
 */
const { sequelize } = require('../models/newIndex');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  try {
    console.log('🚀 금형개발계획 추진계획 마이그레이션 시작...\n');

    // 1. mold_process_steps 테이블에 새 컬럼 추가
    console.log('1️⃣ mold_process_steps 테이블 컬럼 추가...');
    
    const alterQueries = [
      `ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS is_custom BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE`,
      `ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS category VARCHAR(50) DEFAULT 'development'`,
      `ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS sort_order INTEGER`,
      `ALTER TABLE mold_process_steps ADD COLUMN IF NOT EXISTS default_days INTEGER DEFAULT 5`
    ];

    for (const query of alterQueries) {
      try {
        await sequelize.query(query);
        console.log(`   ✅ ${query.split('ADD COLUMN IF NOT EXISTS')[1]?.split(' ')[1] || 'column'} 추가 완료`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`   ⏭️ 컬럼이 이미 존재합니다.`);
        } else {
          console.log(`   ⚠️ ${err.message}`);
        }
      }
    }

    // 2. mold_process_step_masters 테이블 생성
    console.log('\n2️⃣ mold_process_step_masters 테이블 생성...');
    
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS mold_process_step_masters (
        id SERIAL PRIMARY KEY,
        step_number INTEGER NOT NULL,
        step_name VARCHAR(100) NOT NULL,
        category VARCHAR(50) DEFAULT 'development',
        default_days INTEGER DEFAULT 5,
        is_active BOOLEAN DEFAULT TRUE,
        sort_order INTEGER,
        description TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;
    
    await sequelize.query(createTableQuery);
    console.log('   ✅ mold_process_step_masters 테이블 생성 완료');

    // 3. 기본 14단계 데이터 삽입
    console.log('\n3️⃣ 기본 14단계 데이터 삽입...');
    
    const defaultSteps = [
      { step_number: 1, step_name: '도면접수', category: 'development', default_days: 3, sort_order: 1, description: '고객 도면 접수 및 검토' },
      { step_number: 2, step_name: '몰드베이스 발주', category: 'development', default_days: 5, sort_order: 2, description: '몰드베이스 발주 및 입고' },
      { step_number: 3, step_name: '금형설계', category: 'development', default_days: 10, sort_order: 3, description: '금형 설계 및 도면 작성' },
      { step_number: 4, step_name: '도면검토회', category: 'development', default_days: 2, sort_order: 4, description: '설계 도면 검토 회의' },
      { step_number: 5, step_name: '상형가공', category: 'development', default_days: 15, sort_order: 5, description: '상형(캐비티) 가공' },
      { step_number: 6, step_name: '하형가공', category: 'development', default_days: 15, sort_order: 6, description: '하형(코어) 가공' },
      { step_number: 7, step_name: '코어가공', category: 'development', default_days: 10, sort_order: 7, description: '코어 부품 가공' },
      { step_number: 8, step_name: '방전', category: 'development', default_days: 7, sort_order: 8, description: '방전 가공' },
      { step_number: 9, step_name: '격면사상', category: 'development', default_days: 5, sort_order: 9, description: '격면 사상 작업' },
      { step_number: 10, step_name: '금형조립', category: 'development', default_days: 5, sort_order: 10, description: '금형 조립' },
      { step_number: 11, step_name: '습합', category: 'development', default_days: 3, sort_order: 11, description: '습합 및 조정' },
      { step_number: 12, step_name: '초도 T/O', category: 'development', default_days: 3, sort_order: 12, description: '초도 트라이아웃' },
      { step_number: 13, step_name: '초도T/O 이후 금형육성', category: 'nurturing', default_days: 30, sort_order: 13, description: '초도 T/O 이후 금형 육성 및 품질 안정화' },
      { step_number: 14, step_name: '양산이관', category: 'transfer', default_days: 5, sort_order: 14, description: '양산처로 금형 이관' }
    ];

    for (const step of defaultSteps) {
      try {
        // 이미 존재하는지 확인
        const [existing] = await sequelize.query(
          `SELECT id FROM mold_process_step_masters WHERE step_number = :step_number`,
          { replacements: { step_number: step.step_number } }
        );
        
        if (existing.length === 0) {
          await sequelize.query(`
            INSERT INTO mold_process_step_masters (step_number, step_name, category, default_days, sort_order, description)
            VALUES (:step_number, :step_name, :category, :default_days, :sort_order, :description)
          `, { replacements: step });
          console.log(`   ✅ ${step.step_number}. ${step.step_name} 추가 완료`);
        } else {
          console.log(`   ⏭️ ${step.step_number}. ${step.step_name} 이미 존재`);
        }
      } catch (err) {
        console.log(`   ⚠️ ${step.step_name}: ${err.message}`);
      }
    }

    // 4. 인덱스 추가
    console.log('\n4️⃣ 인덱스 추가...');
    
    const indexQueries = [
      `CREATE INDEX IF NOT EXISTS idx_mold_process_steps_category ON mold_process_steps(category)`,
      `CREATE INDEX IF NOT EXISTS idx_mold_process_steps_is_custom ON mold_process_steps(is_custom)`,
      `CREATE INDEX IF NOT EXISTS idx_mold_process_steps_is_deleted ON mold_process_steps(is_deleted)`,
      `CREATE INDEX IF NOT EXISTS idx_mold_process_step_masters_category ON mold_process_step_masters(category)`,
      `CREATE INDEX IF NOT EXISTS idx_mold_process_step_masters_is_active ON mold_process_step_masters(is_active)`
    ];

    for (const query of indexQueries) {
      try {
        await sequelize.query(query);
        const indexName = query.match(/idx_\w+/)?.[0] || 'index';
        console.log(`   ✅ ${indexName} 생성 완료`);
      } catch (err) {
        console.log(`   ⚠️ ${err.message}`);
      }
    }

    // 5. 기존 데이터 업데이트
    console.log('\n5️⃣ 기존 데이터 업데이트...');
    
    try {
      await sequelize.query(`UPDATE mold_process_steps SET sort_order = step_number WHERE sort_order IS NULL`);
      await sequelize.query(`UPDATE mold_process_steps SET category = 'development' WHERE category IS NULL`);
      console.log('   ✅ 기존 데이터 업데이트 완료');
    } catch (err) {
      console.log(`   ⚠️ ${err.message}`);
    }

    console.log('\n✅ 마이그레이션 완료!\n');
    
    // 결과 확인
    const [stepMasters] = await sequelize.query(`SELECT COUNT(*) as count FROM mold_process_step_masters`);
    console.log(`📊 mold_process_step_masters 테이블: ${stepMasters[0].count}개 레코드`);

    process.exit(0);
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

runMigration();
