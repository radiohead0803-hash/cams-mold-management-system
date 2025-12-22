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
    // car_models 테이블 컬럼
    console.log('=== car_models 테이블 ===');
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

    // 샘플 데이터 확인
    console.log('\n=== car_models 샘플 데이터 ===');
    const [carModels] = await sequelize.query(`SELECT * FROM car_models LIMIT 3`);
    console.log(JSON.stringify(carModels, null, 2));

    console.log('\n=== raw_materials 샘플 데이터 ===');
    const [rawMaterials] = await sequelize.query(`SELECT * FROM raw_materials LIMIT 3`);
    console.log(JSON.stringify(rawMaterials, null, 2));

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkTables();
