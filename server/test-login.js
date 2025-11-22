const bcrypt = require('bcryptjs');
const { User } = require('./src/models/newIndex');

async function testLogin() {
  try {
    console.log('🔍 Testing login...\n');

    // 1. 모든 사용자 조회
    const users = await User.findAll({
      attributes: ['id', 'username', 'name', 'user_type', 'company_name', 'is_active']
    });

    console.log('📋 Users in database:');
    users.forEach(user => {
      console.log(`  - ${user.username} (${user.name}) - ${user.user_type} - ${user.company_name}`);
    });
    console.log('');

    // 2. maker1 사용자 조회
    const testUser = await User.findOne({ 
      where: { username: 'maker1', is_active: true } 
    });

    if (!testUser) {
      console.log('❌ User "maker1" not found!');
      process.exit(1);
    }

    console.log('✅ User found:', {
      id: testUser.id,
      username: testUser.username,
      name: testUser.name,
      user_type: testUser.user_type,
      company_name: testUser.company_name,
      is_active: testUser.is_active
    });
    console.log('');

    // 3. 비밀번호 검증
    const password = 'password123';
    const isValid = await bcrypt.compare(password, testUser.password_hash);

    console.log('🔐 Password validation:');
    console.log(`  Input: ${password}`);
    console.log(`  Hash: ${testUser.password_hash.substring(0, 20)}...`);
    console.log(`  Valid: ${isValid ? '✅ YES' : '❌ NO'}`);

    if (isValid) {
      console.log('\n🎉 Login test PASSED!');
    } else {
      console.log('\n❌ Login test FAILED - Password mismatch');
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testLogin();
