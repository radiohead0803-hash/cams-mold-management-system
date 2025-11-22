const axios = require('axios');

async function testLoginAPI() {
  try {
    console.log('🧪 Testing Login API...\n');

    const response = await axios.post('http://localhost:3001/api/v1/auth/login', {
      username: 'admin',
      password: 'password123'
    });

    console.log('✅ Login successful!');
    console.log('\n📦 Response data:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.success) {
      console.log('\n👤 User info:');
      console.log(`  - Username: ${response.data.data.user.username}`);
      console.log(`  - Name: ${response.data.data.user.name}`);
      console.log(`  - User Type: ${response.data.data.user.user_type}`);
      console.log(`  - Company: ${response.data.data.user.company_name}`);
      console.log(`\n🔑 Token: ${response.data.data.token.substring(0, 50)}...`);
    }

  } catch (error) {
    console.error('❌ Login failed!');
    console.error('\n📛 Error details:');
    if (error.response) {
      console.error(`  Status: ${error.response.status}`);
      console.error(`  Message: ${error.response.data?.error?.message || 'Unknown error'}`);
      console.error('\n  Full response:');
      console.error(JSON.stringify(error.response.data, null, 2));
    } else {
      console.error(`  ${error.message}`);
    }
  }
}

testLoginAPI();
