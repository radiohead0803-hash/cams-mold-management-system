const bcrypt = require('bcryptjs');
const { Client } = require('pg');

async function createAdmin() {
  const client = new Client({
    connectionString: process.env.DATABASE_PUBLIC_URL || process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected!');

    // 비밀번호 해시 생성
    const password = 'admin123';
    const passwordHash = await bcrypt.hash(password, 10);

    // 관리자 계정 생성
    const query = `
      INSERT INTO users (username, password_hash, name, email, user_type, company_type, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO UPDATE
      SET password_hash = $2, updated_at = NOW()
      RETURNING id, username, name, user_type;
    `;

    const values = [
      'admin',
      passwordHash,
      'System Administrator',
      'admin@cams.com',
      'system_admin',
      'hq',
      true
    ];

    const result = await client.query(query, values);
    
    console.log('\n✅ Admin user created/updated successfully!');
    console.log('\nLogin credentials:');
    console.log('  Username: admin');
    console.log('  Password: admin123');
    console.log('\nUser details:', result.rows[0]);

    // 제작처 계정도 생성
    const makerPassword = await bcrypt.hash('maker123', 10);
    const makerQuery = `
      INSERT INTO users (username, password_hash, name, email, user_type, company_type, company_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO UPDATE
      SET password_hash = $2, updated_at = NOW()
      RETURNING id, username, name, user_type;
    `;

    const makerValues = [
      'maker1',
      makerPassword,
      'A제작소 담당자',
      'maker1@cams.com',
      'maker',
      'maker',
      'A제작소',
      true
    ];

    const makerResult = await client.query(makerQuery, makerValues);
    
    console.log('\n✅ Maker user created/updated successfully!');
    console.log('\nLogin credentials:');
    console.log('  Username: maker1');
    console.log('  Password: maker123');
    console.log('\nUser details:', makerResult.rows[0]);

    // 금형개발 담당자 계정 생성
    const developerPassword = await bcrypt.hash('dev123', 10);
    const developerQuery = `
      INSERT INTO users (username, password_hash, name, email, user_type, company_type, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (username) DO UPDATE
      SET password_hash = $2, updated_at = NOW()
      RETURNING id, username, name, user_type;
    `;

    const developerValues = [
      'developer',
      developerPassword,
      '금형개발 담당자',
      'developer@cams.com',
      'mold_developer',
      'hq',
      true
    ];

    const developerResult = await client.query(developerQuery, developerValues);
    
    console.log('\n✅ Developer user created/updated successfully!');
    console.log('\nLogin credentials:');
    console.log('  Username: developer');
    console.log('  Password: dev123');
    console.log('\nUser details:', developerResult.rows[0]);

    // 생산처 계정 생성
    const plantPassword = await bcrypt.hash('plant123', 10);
    const plantQuery = `
      INSERT INTO users (username, password_hash, name, email, user_type, company_type, company_name, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (username) DO UPDATE
      SET password_hash = $2, updated_at = NOW()
      RETURNING id, username, name, user_type;
    `;

    const plantValues = [
      'plant1',
      plantPassword,
      '생산처 담당자',
      'plant1@cams.com',
      'plant',
      'plant',
      '생산공장1',
      true
    ];

    const plantResult = await client.query(plantQuery, plantValues);
    
    console.log('\n✅ Plant user created/updated successfully!');
    console.log('\nLogin credentials:');
    console.log('  Username: plant1');
    console.log('  Password: plant123');
    console.log('\nUser details:', plantResult.rows[0]);

    // 요약 출력
    console.log('\n' + '='.repeat(60));
    console.log('📋 테스트 계정 생성 완료 요약');
    console.log('='.repeat(60));
    console.log('\n1. 시스템 관리자 (system_admin)');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('\n2. 금형개발 담당자 (mold_developer)');
    console.log('   Username: developer');
    console.log('   Password: dev123');
    console.log('\n3. 제작처 담당자 (maker)');
    console.log('   Username: maker1');
    console.log('   Password: maker123');
    console.log('\n4. 생산처 담당자 (plant)');
    console.log('   Username: plant1');
    console.log('   Password: plant123');
    console.log('\n' + '='.repeat(60));

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdmin();
