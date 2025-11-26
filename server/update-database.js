/**
 * Railway 데이터베이스 업데이트 스크립트
 * mold_specifications 테이블에 mold_id 컬럼 추가
 */

const { Client } = require('pg');

const SQL_COMMANDS = [
  {
    name: '1. mold_id 컬럼 추가',
    sql: `ALTER TABLE mold_specifications ADD COLUMN IF NOT EXISTS mold_id INTEGER;`
  },
  {
    name: '2. 외래 키 제약 조건 추가',
    sql: `
      DO $$
      BEGIN
          IF NOT EXISTS (
              SELECT 1 FROM pg_constraint 
              WHERE conname = 'fk_mold_specifications_mold_id'
          ) THEN
              ALTER TABLE mold_specifications
              ADD CONSTRAINT fk_mold_specifications_mold_id
              FOREIGN KEY (mold_id) 
              REFERENCES molds(id)
              ON UPDATE CASCADE
              ON DELETE SET NULL;
          END IF;
      END $$;
    `
  },
  {
    name: '3. 인덱스 추가',
    sql: `CREATE INDEX IF NOT EXISTS idx_mold_specifications_mold_id ON mold_specifications(mold_id);`
  },
  {
    name: '4. 컬럼 코멘트 추가',
    sql: `COMMENT ON COLUMN mold_specifications.mold_id IS '연동된 금형 마스터 ID';`
  },
  {
    name: '5. 기존 데이터 업데이트',
    sql: `
      UPDATE mold_specifications ms
      SET mold_id = m.id
      FROM molds m
      WHERE m.specification_id = ms.id
      AND ms.mold_id IS NULL;
    `
  },
  {
    name: '6. 결과 확인',
    sql: `
      SELECT 
          COUNT(*) as total_specs,
          COUNT(mold_id) as specs_with_mold_id,
          COUNT(*) - COUNT(mold_id) as specs_without_mold_id
      FROM mold_specifications;
    `
  }
];

async function updateDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
    console.log('💡 Railway CLI로 실행하세요: railway run node scripts/update-database.js');
    process.exit(1);
  }

  console.log('🚀 데이터베이스 업데이트 시작...\n');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    for (const command of SQL_COMMANDS) {
      console.log(`📝 ${command.name}`);
      
      try {
        const result = await client.query(command.sql);
        
        if (command.name.includes('확인')) {
          console.log('   결과:', result.rows[0]);
        } else {
          console.log('   ✅ 완료');
        }
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ℹ️  이미 존재함 (스킵)');
        } else {
          console.error('   ❌ 오류:', error.message);
          throw error;
        }
      }
      console.log();
    }

    console.log('🎉 데이터베이스 업데이트 완료!\n');

    // 최종 확인
    console.log('📊 최종 확인 쿼리 실행...');
    const finalCheck = await client.query(`
      SELECT 
        column_name, 
        data_type, 
        is_nullable
      FROM information_schema.columns
      WHERE table_name = 'mold_specifications'
      AND column_name = 'mold_id';
    `);

    if (finalCheck.rows.length > 0) {
      console.log('✅ mold_id 컬럼 확인:', finalCheck.rows[0]);
    } else {
      console.log('⚠️  mold_id 컬럼을 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('\n❌ 데이터베이스 업데이트 실패:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
updateDatabase();
