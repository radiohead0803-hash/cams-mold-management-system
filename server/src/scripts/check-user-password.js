const { Client } = require('pg');
const bcrypt = require('bcryptjs');

const RAILWAY_DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

async function checkPassword() {
  const client = new Client({
    connectionString: RAILWAY_DB_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    const result = await client.query("SELECT id, username, password_hash, is_active FROM users WHERE username='admin'");
    console.log('Admin user:', result.rows[0]);
    
    if (result.rows[0]) {
      const hash = result.rows[0].password_hash;
      const testPassword = 'admin123';
      const isValid = await bcrypt.compare(testPassword, hash);
      console.log(`Password 'admin123' valid: ${isValid}`);
      
      // 비밀번호 재설정
      if (!isValid) {
        const newHash = await bcrypt.hash('admin123', 10);
        await client.query("UPDATE users SET password_hash = $1 WHERE username = 'admin'", [newHash]);
        console.log('Password reset to admin123');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

checkPassword();
