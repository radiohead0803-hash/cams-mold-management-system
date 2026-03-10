require('dotenv').config();
const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const sequelize = new Sequelize(DATABASE_URL, { logging: false });

async function runMigration() {
  try {
    console.log('Starting company profile enhancement migration...');
    const sqlPath = path.join(__dirname, '../migrations/20260310_company_profile_enhancement.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await sequelize.query(sql);
    console.log('Migration completed!');

    // Verify
    const [cols] = await sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'companies' AND column_name IN ('latitude','longitude','profile_status') ORDER BY column_name`);
    console.log('Companies new columns:', cols.map(c => c.column_name));

    const [contacts] = await sequelize.query(`SELECT COUNT(*) as c FROM information_schema.tables WHERE table_name = 'company_contacts'`);
    console.log('company_contacts table exists:', contacts[0].c > 0);

    const [certs] = await sequelize.query(`SELECT COUNT(*) as c FROM information_schema.tables WHERE table_name = 'company_certifications'`);
    console.log('company_certifications table exists:', certs[0].c > 0);

    const [eqCols] = await sequelize.query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'company_equipment' AND column_name IN ('requirements','spec_file_url','approval_status') ORDER BY column_name`);
    console.log('company_equipment new columns:', eqCols.map(c => c.column_name));

  } catch (error) {
    console.error('Migration failed:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}
runMigration();
