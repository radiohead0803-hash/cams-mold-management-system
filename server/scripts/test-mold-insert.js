const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_PUBLIC_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testInsert() {
  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'mold_specifications'
      );
    `);

    console.log('\nmold_specifications 테이블 존재:', tableCheck.rows[0].exists);

    if (!tableCheck.rows[0].exists) {
      console.log('\n❌ 테이블이 존재하지 않습니다!');
      console.log('마이그레이션을 실행해야 합니다.');
      await client.end();
      return;
    }

    // Try to insert a test record
    console.log('\n테스트 데이터 삽입 시도...');
    
    const insertResult = await client.query(`
      INSERT INTO mold_specifications (
        part_number,
        part_name,
        car_model,
        development_stage,
        production_stage,
        status,
        created_at,
        updated_at
      ) VALUES (
        'TEST-001',
        '테스트 금형',
        'K5',
        '개발',
        '시제',
        'draft',
        NOW(),
        NOW()
      )
      RETURNING id, part_number, part_name;
    `);

    console.log('\n✅ 삽입 성공!');
    console.log('삽입된 데이터:', insertResult.rows[0]);

    // Clean up test data
    await client.query(`DELETE FROM mold_specifications WHERE part_number = 'TEST-001'`);
    console.log('\n테스트 데이터 삭제 완료');

    await client.end();
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('상세:', error);
    await client.end();
    process.exit(1);
  }
}

testInsert();
