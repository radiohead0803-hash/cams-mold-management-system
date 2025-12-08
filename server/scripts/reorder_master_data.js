/**
 * 마스터 데이터 정렬 순서 재정렬 스크립트
 * 모든 테이블의 sort_order를 1부터 순차적으로 재부여
 */
const { sequelize } = require('../src/models');

async function reorderMasterData() {
  try {
    console.log('=== 마스터 데이터 정렬 순서 재정렬 ===\n');

    // 1. 차종 (car_models) - model_name 기준 정렬
    console.log('[차종 재정렬]');
    const [carModels] = await sequelize.query(`
      SELECT id FROM car_models WHERE is_active = true ORDER BY sort_order ASC, model_name ASC
    `);
    for (let i = 0; i < carModels.length; i++) {
      await sequelize.query(`UPDATE car_models SET sort_order = ${i + 1} WHERE id = ${carModels[i].id}`);
    }
    console.log(`  ${carModels.length}개 항목 재정렬 완료`);

    // 2. 재질 (materials) - material_name 기준 정렬
    console.log('[재질 재정렬]');
    const [materials] = await sequelize.query(`
      SELECT id FROM materials WHERE is_active = true ORDER BY sort_order ASC, material_name ASC
    `);
    for (let i = 0; i < materials.length; i++) {
      await sequelize.query(`UPDATE materials SET sort_order = ${i + 1} WHERE id = ${materials[i].id}`);
    }
    console.log(`  ${materials.length}개 항목 재정렬 완료`);

    // 3. 금형타입 (mold_types) - type_name 기준 정렬
    console.log('[금형타입 재정렬]');
    const [moldTypes] = await sequelize.query(`
      SELECT id FROM mold_types WHERE is_active = true ORDER BY sort_order ASC, type_name ASC
    `);
    for (let i = 0; i < moldTypes.length; i++) {
      await sequelize.query(`UPDATE mold_types SET sort_order = ${i + 1} WHERE id = ${moldTypes[i].id}`);
    }
    console.log(`  ${moldTypes.length}개 항목 재정렬 완료`);

    // 4. 톤수 (tonnages) - tonnage_value 기준 정렬
    console.log('[톤수 재정렬]');
    const [tonnages] = await sequelize.query(`
      SELECT id FROM tonnages WHERE is_active = true ORDER BY tonnage_value ASC
    `);
    for (let i = 0; i < tonnages.length; i++) {
      await sequelize.query(`UPDATE tonnages SET sort_order = ${i + 1} WHERE id = ${tonnages[i].id}`);
    }
    console.log(`  ${tonnages.length}개 항목 재정렬 완료`);

    console.log('\n=== 재정렬 완료 ===');

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

reorderMasterData();
