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

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createAdmin();
