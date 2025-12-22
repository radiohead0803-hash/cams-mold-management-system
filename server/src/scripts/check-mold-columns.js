const { Sequelize } = require('sequelize');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function check() {
  try {
    const [cols] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'mold_specifications' 
      ORDER BY ordinal_position
    `);
    console.log('mold_specifications columns:');
    console.log(cols.map(c => c.column_name).join(', '));
    
    const [molds] = await sequelize.query(`
      SELECT id, mold_code, part_name, part_number 
      FROM mold_specifications 
      LIMIT 5
    `);
    console.log('\nSample molds:');
    console.log(molds);
    
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}

check();
