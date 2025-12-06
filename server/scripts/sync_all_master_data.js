/**
 * 모든 기초정보(마스터 데이터) 동기화 및 금형 정보 연동 스크립트
 * - 차종, 재질, 금형타입, 톤수
 * - 업체(companies) 정보
 */
const { sequelize } = require('../src/models');

async function syncAllMasterData() {
  try {
    console.log('=== 전체 기초정보 동기화 및 금형 연동 ===\n');

    // 0. companies 테이블 스키마 확인
    console.log('0. companies 테이블 확인...');
    const [companyColumns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'companies' ORDER BY ordinal_position
    `);
    console.log(`   컬럼: ${companyColumns.map(c => c.column_name).join(', ')}`);

    // 1. 차종(car_model) 동기화
    console.log('\n1. 차종(car_models) 동기화...');
    const [uniqueCarModels] = await sequelize.query(`
      SELECT DISTINCT car_model FROM molds 
      WHERE car_model IS NOT NULL AND car_model != ''
    `);
    console.log(`   molds에서 발견된 차종: ${uniqueCarModels.length}개`);

    for (const row of uniqueCarModels) {
      const carModel = row.car_model;
      const [existing] = await sequelize.query(`
        SELECT id FROM car_models WHERE model_name = $1
      `, { bind: [carModel] });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO car_models (model_name, model_code, manufacturer, is_active, sort_order, created_at, updated_at)
          VALUES ($1, $1, '미지정', true, 99, NOW(), NOW())
        `, { bind: [carModel] });
        console.log(`   ✅ 추가: ${carModel}`);
      }
    }

    // molds.car_model_id 업데이트
    await sequelize.query(`
      UPDATE molds m SET car_model_id = cm.id
      FROM car_models cm WHERE m.car_model = cm.model_name AND m.car_model_id IS NULL
    `);

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

    await sequelize.query(`
      UPDATE molds m SET material_id = mt.id
      FROM materials mt WHERE m.material = mt.material_name AND m.material_id IS NULL
    `);

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

    await sequelize.query(`
      UPDATE molds m SET mold_type_id = mt.id
      FROM mold_types mt WHERE m.mold_type = mt.type_name AND m.mold_type_id IS NULL
    `);

    // 4. 톤수(tonnage) 동기화
    console.log('\n4. 톤수(tonnages) 동기화...');
    const [uniqueTonnages] = await sequelize.query(`
      SELECT DISTINCT tonnage FROM molds WHERE tonnage IS NOT NULL
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

    await sequelize.query(`
      UPDATE molds m SET tonnage_id = t.id
      FROM tonnages t WHERE m.tonnage = t.tonnage_value AND m.tonnage_id IS NULL
    `);

    // 5. 업체(companies) 동기화
    console.log('\n5. 업체(companies) 동기화...');
    
    // 현재 companies 데이터 확인
    const [existingCompanies] = await sequelize.query(`SELECT * FROM companies`);
    console.log(`   현재 등록된 업체: ${existingCompanies.length}개`);

    // mold_specifications에서 maker_company_id, plant_company_id 확인
    const [makerIds] = await sequelize.query(`
      SELECT DISTINCT maker_company_id FROM mold_specifications 
      WHERE maker_company_id IS NOT NULL
    `);
    const [plantIds] = await sequelize.query(`
      SELECT DISTINCT plant_company_id FROM mold_specifications 
      WHERE plant_company_id IS NOT NULL
    `);
    console.log(`   mold_specifications의 제작처 ID: ${makerIds.map(r => r.maker_company_id).join(', ') || '없음'}`);
    console.log(`   mold_specifications의 생산처 ID: ${plantIds.map(r => r.plant_company_id).join(', ') || '없음'}`);

    // 기본 업체 데이터 추가 (없는 경우)
    const defaultCompanies = [
      { name: '본사', code: 'HQ', type: 'headquarters', address: '서울시' },
      { name: '제작처 A', code: 'MAKER-A', type: 'maker', address: '경기도' },
      { name: '제작처 B', code: 'MAKER-B', type: 'maker', address: '인천시' },
      { name: '생산처 1공장', code: 'PLANT-1', type: 'plant', address: '충청남도' },
      { name: '생산처 2공장', code: 'PLANT-2', type: 'plant', address: '경상북도' },
      { name: '협력업체 C', code: 'PARTNER-C', type: 'maker', address: '부산시' }
    ];

    for (const company of defaultCompanies) {
      const [existing] = await sequelize.query(`
        SELECT id FROM companies WHERE company_code = $1 OR company_name = $2
      `, { bind: [company.code, company.name] });

      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO companies (company_name, company_code, company_type, address, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, true, NOW(), NOW())
        `, { bind: [company.name, company.code, company.type, company.address] });
        console.log(`   ✅ 추가: ${company.name} (${company.type})`);
      }
    }

    // molds 테이블에 maker_company_id, plant_company_id가 없는 경우 기본값 설정
    // 먼저 본사, 제작처, 생산처 ID 조회
    const [hqCompany] = await sequelize.query(`SELECT id FROM companies WHERE company_type = 'headquarters' LIMIT 1`);
    const [makerCompany] = await sequelize.query(`SELECT id FROM companies WHERE company_type = 'maker' LIMIT 1`);
    const [plantCompany] = await sequelize.query(`SELECT id FROM companies WHERE company_type = 'plant' LIMIT 1`);

    if (makerCompany.length > 0) {
      await sequelize.query(`
        UPDATE molds SET maker_company_id = $1 
        WHERE maker_company_id IS NULL AND specification_id IS NOT NULL
      `, { bind: [makerCompany[0].id] });
    }

    if (plantCompany.length > 0) {
      await sequelize.query(`
        UPDATE molds SET plant_company_id = $1 
        WHERE plant_company_id IS NULL AND specification_id IS NOT NULL
      `, { bind: [plantCompany[0].id] });
    }

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

    // 업체 목록 출력
    const [allCompanies] = await sequelize.query(`
      SELECT id, company_name, company_code, company_type FROM companies ORDER BY id
    `);
    console.log('\n업체 목록:');
    allCompanies.forEach(c => {
      console.log(`  - [${c.id}] ${c.company_name} (${c.company_type})`);
    });

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

syncAllMasterData();
