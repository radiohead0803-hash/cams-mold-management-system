const { Sequelize } = require('sequelize');

const DATABASE_URL = 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  }
});

async function checkTables() {
  try {
    // mold_specifications 테이블 컬럼 (전체)
    console.log('=== mold_specifications 테이블 (전체 컬럼) ===');
    const [moldSpecCols] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'mold_specifications' ORDER BY ordinal_position
    `);
    moldSpecCols.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));
    console.log(`\n총 컬럼 수: ${moldSpecCols.length}`);

    // car_models 테이블 컬럼
    console.log('\n=== car_models 테이블 ===');
    const [carModelCols] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'car_models' ORDER BY ordinal_position
    `);
    carModelCols.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    // materials 테이블 컬럼
    console.log('\n=== materials 테이블 ===');
    const [materialCols] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'materials' ORDER BY ordinal_position
    `);
    materialCols.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    // mold_types 테이블 컬럼
    console.log('\n=== mold_types 테이블 ===');
    const [moldTypeCols] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'mold_types' ORDER BY ordinal_position
    `);
    moldTypeCols.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    // raw_materials 테이블 컬럼
    console.log('\n=== raw_materials 테이블 ===');
    const [rawMaterialCols] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'raw_materials' ORDER BY ordinal_position
    `);
    rawMaterialCols.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    // companies 테이블 컬럼
    console.log('\n=== companies 테이블 ===');
    const [companyCols] = await sequelize.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'companies' ORDER BY ordinal_position
    `);
    companyCols.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTables();
