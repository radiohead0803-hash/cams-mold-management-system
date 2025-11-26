/**
 * Railway 데이터베이스 롤백 스크립트
 * mold_specifications 테이블에서 mold_id 컬럼 제거
 */

const { Client } = require('pg');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

const ROLLBACK_COMMANDS = [
  {
    name: '1. 인덱스 제거',
    sql: `DROP INDEX IF EXISTS idx_mold_specifications_mold_id;`
  },
  {
    name: '2. 외래 키 제약 제거',
    sql: `ALTER TABLE mold_specifications DROP CONSTRAINT IF EXISTS fk_mold_specifications_mold_id;`
  },
  {
    name: '3. mold_id 컬럼 제거',
    sql: `ALTER TABLE mold_specifications DROP COLUMN IF EXISTS mold_id;`
  }
];

async function rollbackDatabase() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL 환경변수가 설정되지 않았습니다.');
    console.log('💡 Railway CLI로 실행하세요: railway run node scripts/rollback-database.js');
    process.exit(1);
  }

  console.log('⚠️  데이터베이스 롤백 스크립트\n');
  console.log('이 스크립트는 다음 작업을 수행합니다:');
  console.log('- mold_specifications.mold_id 컬럼 제거');
  console.log('- 관련 인덱스 및 외래 키 제거\n');

  const answer = await question('정말 롤백하시겠습니까? (yes/no): ');
  
  if (answer.toLowerCase() !== 'yes') {
    console.log('❌ 롤백이 취소되었습니다.');
    rl.close();
    process.exit(0);
  }

  console.log('\n🚀 데이터베이스 롤백 시작...\n');

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    for (const command of ROLLBACK_COMMANDS) {
      console.log(`📝 ${command.name}`);
      
      try {
        await client.query(command.sql);
        console.log('   ✅ 완료');
      } catch (error) {
        console.error('   ❌ 오류:', error.message);
        throw error;
      }
      console.log();
    }

    console.log('🎉 데이터베이스 롤백 완료!\n');

    // 최종 확인
    console.log('📊 최종 확인 쿼리 실행...');
    const finalCheck = await client.query(`
      SELECT 
        column_name
      FROM information_schema.columns
      WHERE table_name = 'mold_specifications'
      AND column_name = 'mold_id';
    `);

    if (finalCheck.rows.length === 0) {
      console.log('✅ mold_id 컬럼이 성공적으로 제거되었습니다.');
    } else {
      console.log('⚠️  mold_id 컬럼이 여전히 존재합니다.');
    }

  } catch (error) {
    console.error('\n❌ 데이터베이스 롤백 실패:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    rl.close();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
rollbackDatabase();
