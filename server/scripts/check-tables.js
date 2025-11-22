const { Sequelize } = require('sequelize');
const config = require('../src/config/database');

const env = process.env.NODE_ENV || 'production';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, dbConfig);

async function checkTables() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected!');

    // Check mold_specifications table
    const [results] = await sequelize.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'mold_specifications'
      ORDER BY ordinal_position
    `);

    if (results.length === 0) {
      console.log('\n❌ mold_specifications 테이블이 존재하지 않습니다!');
      console.log('\n테이블을 생성해야 합니다.');
    } else {
      console.log('\n✅ mold_specifications 테이블 존재');
      console.log(`\n컬럼 수: ${results.length}`);
      console.log('\n컬럼 목록:');
      results.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTables();
