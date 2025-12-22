const { Sequelize } = require('sequelize');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function checkColumns() {
  try {
    const [rows] = await sequelize.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'mold_specifications' 
      ORDER BY ordinal_position
    `);
    
    console.log('=== mold_specifications 테이블 컬럼 ===');
    rows.forEach(r => {
      console.log(`${r.column_name} | ${r.data_type} | nullable: ${r.is_nullable}`);
    });
    
    console.log('\n총 컬럼 수:', rows.length);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkColumns();
