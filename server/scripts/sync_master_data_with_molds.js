/**
 * 기초정보(마스터 데이터) 동기화 및 금형 정보 연동 스크립트
 * 1. molds 테이블의 car_model, material, mold_type, tonnage 값을 확인
 * 2. 해당 값이 마스터 테이블에 없으면 추가
 * 3. molds 테이블의 FK 컬럼 업데이트
 */
const { sequelize } = require('../src/models');

async function syncMasterDataWithMolds() {
  try {
    console.log('=== 기초정보 동기화 및 금형 연동 ===\n');

    // 1. 차종(car_model) 동기화
    console.log('1. 차종(car_models) 동기화...');
    const [uniqueCarModels] = await sequelize.query(`
      SELECT DISTINCT car_model FROM molds 
      WHERE car_model IS NOT NULL AND car_model != ''
    `);
    console.log(`   molds에서 발견된 차종: ${uniqueCarModels.length}개`);

    for (const row of uniqueCarModels) {
      const carModel = row.car_model;
      // 이미 존재하는지 확인
      const [existing] = await sequelize.query(`
        SELECT id FROM car_models WHERE model_name = $1
      `, { bind: [carModel] });

      if (existing.length === 0) {
        // 새로 추가
        await sequelize.query(`
          INSERT INTO car_models (model_name, model_code, manufacturer, is_active, sort_order, created_at, updated_at)
          VALUES ($1, $1, '미지정', true, 99, NOW(), NOW())
        `, { bind: [carModel] });
        console.log(`   ✅ 추가: ${carModel}`);
      }
    }

    // molds.car_model_id 업데이트
    await sequelize.query(`
      UPDATE molds m
      SET car_model_id = cm.id
      FROM car_models cm
      WHERE m.car_model = cm.model_name
        AND m.car_model_id IS NULL
    `);
    const [carModelUpdated] = await sequelize.query(`
      SELECT COUNT(*) as cnt FROM molds WHERE car_model_id IS NOT NULL
    `);
    console.log(`   → ${carModelUpdated[0].cnt}개 금형에 car_model_id 연동됨`);

    // 2. 재질(material) 동기화
    console.log('\n2. 재질(materials) 동기화...');
    const [uniqueMaterials] = await sequelize.query(`
      SELECT DISTINCT material FROM molds 
      WHERE material IS NOT NULL AND material != ''
    `);
    console.log(`   molds에서 발견된 재질: ${uniqueMaterials.length}개`);

    for (const row of uniqueMaterials) {
      const material = row.material;
      const [existing] = await sequelize.query(`
        SELECT id FROM materials WHERE material_name = $1
      `, { bind: [material] });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO materials (material_name, material_code, category, is_active, sort_order, created_at, updated_at)
          VALUES ($1, $1, '미분류', true, 99, NOW(), NOW())
        `, { bind: [material] });
        console.log(`   ✅ 추가: ${material}`);
      }
    }

    // molds.material_id 업데이트
    await sequelize.query(`
      UPDATE molds m
      SET material_id = mt.id
      FROM materials mt
      WHERE m.material = mt.material_name
        AND m.material_id IS NULL
    `);
    const [materialUpdated] = await sequelize.query(`
      SELECT COUNT(*) as cnt FROM molds WHERE material_id IS NOT NULL
    `);
    console.log(`   → ${materialUpdated[0].cnt}개 금형에 material_id 연동됨`);

    // 3. 금형타입(mold_type) 동기화
    console.log('\n3. 금형타입(mold_types) 동기화...');
    const [uniqueMoldTypes] = await sequelize.query(`
      SELECT DISTINCT mold_type FROM molds 
      WHERE mold_type IS NOT NULL AND mold_type != ''
    `);
    console.log(`   molds에서 발견된 금형타입: ${uniqueMoldTypes.length}개`);

    for (const row of uniqueMoldTypes) {
      const moldType = row.mold_type;
      const [existing] = await sequelize.query(`
        SELECT id FROM mold_types WHERE type_name = $1
      `, { bind: [moldType] });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO mold_types (type_name, type_code, is_active, sort_order, created_at, updated_at)
          VALUES ($1, $1, true, 99, NOW(), NOW())
        `, { bind: [moldType] });
        console.log(`   ✅ 추가: ${moldType}`);
      }
    }

    // molds.mold_type_id 업데이트
    await sequelize.query(`
      UPDATE molds m
      SET mold_type_id = mt.id
      FROM mold_types mt
      WHERE m.mold_type = mt.type_name
        AND m.mold_type_id IS NULL
    `);
    const [moldTypeUpdated] = await sequelize.query(`
      SELECT COUNT(*) as cnt FROM molds WHERE mold_type_id IS NOT NULL
    `);
    console.log(`   → ${moldTypeUpdated[0].cnt}개 금형에 mold_type_id 연동됨`);

    // 4. 톤수(tonnage) 동기화
    console.log('\n4. 톤수(tonnages) 동기화...');
    const [uniqueTonnages] = await sequelize.query(`
      SELECT DISTINCT tonnage FROM molds 
      WHERE tonnage IS NOT NULL
    `);
    console.log(`   molds에서 발견된 톤수: ${uniqueTonnages.length}개`);

    for (const row of uniqueTonnages) {
      const tonnage = row.tonnage;
      const [existing] = await sequelize.query(`
        SELECT id FROM tonnages WHERE tonnage_value = $1
      `, { bind: [tonnage] });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO tonnages (tonnage_value, is_active, sort_order, created_at, updated_at)
          VALUES ($1, true, 99, NOW(), NOW())
        `, { bind: [tonnage] });
        console.log(`   ✅ 추가: ${tonnage}T`);
      }
    }

    // molds.tonnage_id 업데이트
    await sequelize.query(`
      UPDATE molds m
      SET tonnage_id = t.id
      FROM tonnages t
      WHERE m.tonnage = t.tonnage_value
        AND m.tonnage_id IS NULL
    `);
    const [tonnageUpdated] = await sequelize.query(`
      SELECT COUNT(*) as cnt FROM molds WHERE tonnage_id IS NOT NULL
    `);
    console.log(`   → ${tonnageUpdated[0].cnt}개 금형에 tonnage_id 연동됨`);

    // 5. 최종 결과 확인
    console.log('\n=== 최종 결과 ===');
    
    const [carModelsCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM car_models`);
    const [materialsCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM materials`);
    const [moldTypesCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM mold_types`);
    const [tonnagesCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM tonnages`);
    
    console.log(`차종: ${carModelsCount[0].cnt}개`);
    console.log(`재질: ${materialsCount[0].cnt}개`);
    console.log(`금형타입: ${moldTypesCount[0].cnt}개`);
    console.log(`톤수: ${tonnagesCount[0].cnt}개`);

    // 연동 현황
    const [linkedStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(car_model_id) as car_model_linked,
        COUNT(material_id) as material_linked,
        COUNT(mold_type_id) as mold_type_linked,
        COUNT(tonnage_id) as tonnage_linked
      FROM molds
    `);
    
    console.log(`\n금형 연동 현황 (총 ${linkedStats[0].total}개):`);
    console.log(`  - 차종 연동: ${linkedStats[0].car_model_linked}개`);
    console.log(`  - 재질 연동: ${linkedStats[0].material_linked}개`);
    console.log(`  - 금형타입 연동: ${linkedStats[0].mold_type_linked}개`);
    console.log(`  - 톤수 연동: ${linkedStats[0].tonnage_linked}개`);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

syncMasterDataWithMolds();
