const { sequelize } = require('./src/models/newIndex');

async function updateUsers() {
  try {
    console.log('🔄 Updating existing users...\n');

    // Update company_name for existing users
    await sequelize.query(`
      UPDATE users 
      SET company_name = CASE 
        WHEN user_type = 'system_admin' THEN '본사'
        WHEN user_type = 'mold_developer' THEN '본사'
        WHEN user_type = 'maker' THEN '제작처A'
        WHEN user_type = 'plant' THEN '생산처A'
        ELSE '본사'
      END
      WHERE company_name IS NULL
    `);

    console.log('✅ Users updated successfully!\n');

    // Verify
    const [users] = await sequelize.query(`
      SELECT username, name, user_type, company_name 
      FROM users 
      ORDER BY id
    `);

    console.log('📋 Updated users:');
    users.forEach(user => {
      console.log(`  - ${user.username}: ${user.company_name} (${user.user_type})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updateUsers();
