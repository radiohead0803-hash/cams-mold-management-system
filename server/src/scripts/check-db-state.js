const { Sequelize } = require('sequelize');
const DB_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const s = new Sequelize(DB_URL, { logging: false });

(async () => {
  try {
    const [companies] = await s.query('SELECT id, company_code, company_name, company_type FROM companies ORDER BY id');
    console.log('=== COMPANIES ===');
    console.log(JSON.stringify(companies, null, 2));

    const [users] = await s.query('SELECT id, username, user_type, company_id, company_name FROM users ORDER BY id');
    console.log('\n=== USERS ===');
    console.log(JSON.stringify(users, null, 2));

    const [moldSpecs] = await s.query('SELECT id, part_number, part_name, maker_company_id, plant_company_id FROM mold_specifications LIMIT 10');
    console.log('\n=== MOLD_SPECIFICATIONS (top 10) ===');
    console.log(JSON.stringify(moldSpecs, null, 2));

    const [molds] = await s.query('SELECT id, mold_code, mold_name, maker_id, plant_id, maker_company_id, plant_company_id, status FROM molds LIMIT 10');
    console.log('\n=== MOLDS (top 10) ===');
    console.log(JSON.stringify(molds, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
  } finally {
    await s.close();
  }
})();
