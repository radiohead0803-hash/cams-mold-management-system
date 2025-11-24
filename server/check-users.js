const { Sequelize } = require('sequelize');
const config = require('./src/config/database');

const env = process.env.NODE_ENV || 'production';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, {
  ...dbConfig,
  logging: false
});

async function checkUsers() {
  try {
    await sequelize.authenticate();
    console.log('\n✅ 데이터베이스 연결 성공\n');
    
    // 모든 사용자 조회
    const [users] = await sequelize.query(`
      SELECT 
        id, 
        username, 
        name,
        email,
        user_type,
        company_id,
        is_active,
        last_login_at,
        created_at
      FROM users 
      ORDER BY id;
    `);

    console.log('📊 등록된 사용자 목록:\n');
    console.log('┌─────┬──────────────┬────────────────┬──────────────────┬──────────────┬────────┬──────────┐');
    console.log('│ ID  │ Username     │ Name           │ Email            │ User Type    │ Active │ Company  │');
    console.log('├─────┼──────────────┼────────────────┼──────────────────┼──────────────┼────────┼──────────┤');
    
    users.forEach(u => {
      const userTypeLabel = {
        'system_admin': '시스템관리자',
        'mold_developer': '금형개발',
        'maker': '제작처',
        'plant': '생산처'
      }[u.user_type] || u.user_type;
      
      console.log(
        `│ ${String(u.id).padEnd(3)} │ ${u.username.padEnd(12)} │ ${(u.name || '').padEnd(14)} │ ${(u.email || '-').padEnd(16)} │ ${userTypeLabel.padEnd(12)} │ ${u.is_active ? '✅' : '❌'}    │ ${String(u.company_id || '-').padEnd(8)} │`
      );
    });
    
    console.log('└─────┴──────────────┴────────────────┴──────────────────┴──────────────┴────────┴──────────┘');
    
    // 테스트 계정 확인
    console.log('\n🔍 테스트 계정 확인:\n');
    
    const testAccounts = ['developer', 'admin', 'maker1', 'plant1'];
    
    for (const username of testAccounts) {
      const [result] = await sequelize.query(`
        SELECT id, username, name, user_type, is_active, password_hash
        FROM users 
        WHERE username = ?;
      `, {
        replacements: [username]
      });
      
      if (result.length > 0) {
        const user = result[0];
        console.log(`✅ ${username.padEnd(12)} - ${user.name || 'N/A'} (${user.user_type}) - 비밀번호 해시: ${user.password_hash ? '있음' : '없음'}`);
      } else {
        console.log(`❌ ${username.padEnd(12)} - 계정 없음`);
      }
    }
    
    // 통계
    const [stats] = await sequelize.query(`
      SELECT 
        user_type,
        COUNT(*) as count,
        SUM(CASE WHEN is_active THEN 1 ELSE 0 END) as active_count
      FROM users
      GROUP BY user_type;
    `);
    
    console.log('\n📈 사용자 통계:\n');
    stats.forEach(s => {
      const label = {
        'system_admin': '시스템관리자',
        'mold_developer': '금형개발',
        'maker': '제작처',
        'plant': '생산처'
      }[s.user_type] || s.user_type;
      
      console.log(`${label}: ${s.count}명 (활성: ${s.active_count}명)`);
    });
    
    const [total] = await sequelize.query(`SELECT COUNT(*) as total FROM users;`);
    console.log(`\n✅ 총 ${total[0].total}명의 사용자 등록됨\n`);

  } catch (error) {
    console.error('❌ 에러:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkUsers();
