/**
 * 마스터 데이터 실제 내용 확인 스크립트
 */
const { sequelize } = require('../src/models');

async function checkMasterData() {
  try {
    console.log('=== 마스터 데이터 상세 확인 ===\n');

    // car_models
    console.log('--- car_models ---');
    const [carModels] = await sequelize.query('SELECT * FROM car_models LIMIT 10');
    console.log(JSON.stringify(carModels, null, 2));

    // materials
    console.log('\n--- materials ---');
    const [materials] = await sequelize.query('SELECT * FROM materials LIMIT 10');
    console.log(JSON.stringify(materials, null, 2));

    // mold_types
    console.log('\n--- mold_types ---');
    const [moldTypes] = await sequelize.query('SELECT * FROM mold_types LIMIT 10');
    console.log(JSON.stringify(moldTypes, null, 2));

    // tonnages
    console.log('\n--- tonnages ---');
    const [tonnages] = await sequelize.query('SELECT * FROM tonnages LIMIT 10');
    console.log(JSON.stringify(tonnages, null, 2));

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkMasterData();
