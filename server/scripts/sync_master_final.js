/**
 * 기초정보 동기화 및 금형 연동 (최종 버전)
 */
const { sequelize } = require('../src/models');

async function syncMasterFinal() {
  try {
    console.log('=== 기초정보 동기화 및 금형 연동 ===\n');

    // 1. 차종 동기화
    console.log('1. 차종(car_models) 동기화...');
    const [uniqueCarModels] = await sequelize.query(`
      SELECT DISTINCT car_model FROM molds 
      WHERE car_model IS NOT NULL AND car_model != ''
    `);

    for (const row of uniqueCarModels) {
      const [existing] = await sequelize.query(`
        SELECT id FROM car_models WHERE model_name = $1
      `, { bind: [row.car_model] });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO car_models (model_name, model_code, manufacturer, is_active, sort_order, created_at, updated_at)
          VALUES ($1, $1, '미지정', true, 99, NOW(), NOW())
        `, { bind: [row.car_model] });
        console.log(`   ✅ 추가: ${row.car_model}`);
      }
    }

    await sequelize.query(`
      UPDATE molds m SET car_model_id = cm.id
      FROM car_models cm WHERE m.car_model = cm.model_name AND m.car_model_id IS NULL
    `);

    // 2. 재질 동기화
    console.log('\n2. 재질(materials) 동기화...');
    const [uniqueMaterials] = await sequelize.query(`
      SELECT DISTINCT material FROM molds 
      WHERE material IS NOT NULL AND material != ''
    `);

    for (const row of uniqueMaterials) {
      const [existing] = await sequelize.query(`
        SELECT id FROM materials WHERE material_name = $1
      `, { bind: [row.material] });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO materials (material_name, material_code, category, is_active, sort_order, created_at, updated_at)
          VALUES ($1, $1, '미분류', true, 99, NOW(), NOW())
        `, { bind: [row.material] });
        console.log(`   ✅ 추가: ${row.material}`);
      }
    }

    await sequelize.query(`
      UPDATE molds m SET material_id = mt.id
      FROM materials mt WHERE m.material = mt.material_name AND m.material_id IS NULL
    `);

    // 3. 금형타입 동기화
    console.log('\n3. 금형타입(mold_types) 동기화...');
    const [uniqueMoldTypes] = await sequelize.query(`
      SELECT DISTINCT mold_type FROM molds 
      WHERE mold_type IS NOT NULL AND mold_type != ''
    `);

    for (const row of uniqueMoldTypes) {
      const [existing] = await sequelize.query(`
        SELECT id FROM mold_types WHERE type_name = $1
      `, { bind: [row.mold_type] });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO mold_types (type_name, type_code, is_active, sort_order, created_at, updated_at)
          VALUES ($1, $1, true, 99, NOW(), NOW())
        `, { bind: [row.mold_type] });
        console.log(`   ✅ 추가: ${row.mold_type}`);
      }
    }

    await sequelize.query(`
      UPDATE molds m SET mold_type_id = mt.id
      FROM mold_types mt WHERE m.mold_type = mt.type_name AND m.mold_type_id IS NULL
    `);

    // 4. 톤수 동기화
    console.log('\n4. 톤수(tonnages) 동기화...');
    const [uniqueTonnages] = await sequelize.query(`
      SELECT DISTINCT tonnage FROM molds WHERE tonnage IS NOT NULL
    `);

    for (const row of uniqueTonnages) {
      const [existing] = await sequelize.query(`
        SELECT id FROM tonnages WHERE tonnage_value = $1
      `, { bind: [row.tonnage] });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO tonnages (tonnage_value, is_active, sort_order, created_at, updated_at)
          VALUES ($1, true, 99, NOW(), NOW())
        `, { bind: [row.tonnage] });
        console.log(`   ✅ 추가: ${row.tonnage}T`);
      }
    }

    await sequelize.query(`
      UPDATE molds m SET tonnage_id = t.id
      FROM tonnages t WHERE m.tonnage = t.tonnage_value AND m.tonnage_id IS NULL
    `);

    // 5. 업체 연동 (mold_specifications에서 가져온 maker_company_id, plant_company_id 사용)
    console.log('\n5. 업체(companies) 연동...');
    
    // mold_specifications의 maker_company_id, plant_company_id를 molds에 복사
    await sequelize.query(`
      UPDATE molds m
      SET maker_company_id = ms.maker_company_id
      FROM mold_specifications ms
      WHERE m.specification_id = ms.id
        AND m.maker_company_id IS NULL
        AND ms.maker_company_id IS NOT NULL
    `);

    await sequelize.query(`
      UPDATE molds m
      SET plant_company_id = ms.plant_company_id
      FROM mold_specifications ms
      WHERE m.specification_id = ms.id
        AND m.plant_company_id IS NULL
        AND ms.plant_company_id IS NOT NULL
    `);

    // 6. 최종 결과 확인
    console.log('\n=== 최종 결과 ===');
    
    const [carModelsCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM car_models`);
    const [materialsCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM materials`);
    const [moldTypesCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM mold_types`);
    const [tonnagesCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM tonnages`);
    const [companiesCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM companies`);
    
    console.log(`차종: ${carModelsCount[0].cnt}개`);
    console.log(`재질: ${materialsCount[0].cnt}개`);
    console.log(`금형타입: ${moldTypesCount[0].cnt}개`);
    console.log(`톤수: ${tonnagesCount[0].cnt}개`);
    console.log(`업체: ${companiesCount[0].cnt}개`);

    // 업체 목록
    const [companies] = await sequelize.query(`
      SELECT id, company_name, company_type FROM companies ORDER BY company_type, id
    `);
    console.log('\n업체 목록:');
    companies.forEach(c => console.log(`  [${c.id}] ${c.company_name} (${c.company_type})`));

    // 금형 연동 현황
    const [linkedStats] = await sequelize.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(car_model_id) as car_model_linked,
        COUNT(material_id) as material_linked,
        COUNT(mold_type_id) as mold_type_linked,
        COUNT(tonnage_id) as tonnage_linked,
        COUNT(maker_company_id) as maker_linked,
        COUNT(plant_company_id) as plant_linked
      FROM molds
    `);
    
    console.log(`\n금형 연동 현황 (총 ${linkedStats[0].total}개):`);
    console.log(`  - 차종: ${linkedStats[0].car_model_linked}개`);
    console.log(`  - 재질: ${linkedStats[0].material_linked}개`);
    console.log(`  - 금형타입: ${linkedStats[0].mold_type_linked}개`);
    console.log(`  - 톤수: ${linkedStats[0].tonnage_linked}개`);
    console.log(`  - 제작처: ${linkedStats[0].maker_linked}개`);
    console.log(`  - 생산처: ${linkedStats[0].plant_linked}개`);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

syncMasterFinal();
