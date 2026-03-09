const { Sequelize } = require('sequelize');
const DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const s = new Sequelize(DB_URL, { logging: false });

(async () => {
  try {
    const [companies] = await s.query('SELECT id, company_code, company_name, company_type FROM companies ORDER BY id');
    console.log('=== COMPANIES (' + companies.length + ') ===');
    companies.forEach(c => console.log(`  [${c.id}] ${c.company_code} | ${c.company_name} | ${c.company_type}`));

    const [users] = await s.query("SELECT id, username, user_type, company_id, company_name FROM users WHERE user_type IN ('maker','plant') ORDER BY id");
    console.log('\n=== MAKER/PLANT USERS (' + users.length + ') ===');
    users.forEach(u => console.log(`  [${u.id}] ${u.username} | ${u.user_type} | company_id=${u.company_id} | ${u.company_name}`));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await s.close();
  }
})();
