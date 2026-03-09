const { Sequelize } = require('sequelize');
const s = new Sequelize('postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway', { logging: false });

(async () => {
  const [rows] = await s.query(
    "SELECT id, username, name, email, company_name, user_type FROM users WHERE user_type = 'plant' AND is_active = true ORDER BY company_name, name"
  );
  console.log('=== 생산처(Plant) 계정 목록 ===');
  console.log('총 ' + rows.length + '개\n');
  console.log('ID\tUsername\t\tName\t\tCompany\t\t\tEmail');
  console.log('-'.repeat(90));
  rows.forEach(r => {
    console.log(r.id + '\t' + (r.username||'').padEnd(16) + '\t' + (r.name||'').padEnd(12) + '\t' + (r.company_name||'').padEnd(20) + '\t' + (r.email||''));
  });
  await s.close();
})();
