/**
 * 마스터 데이터 테스트 데이터 추가 스크립트
 */
const { sequelize } = require('../src/models');

async function addTestData() {
  try {
    console.log('=== 마스터 데이터 테스트 데이터 추가 ===\n');

    // 1. 차종 추가
    console.log('[차종 추가]');
    const carModels = [
      { model_name: 'EV6', model_code: 'CV', manufacturer: '기아', sort_order: 10 },
      { model_name: 'EV9', model_code: 'MV', manufacturer: '기아', sort_order: 11 },
      { model_name: '아이오닉5', model_code: 'NE', manufacturer: '현대', sort_order: 12 },
      { model_name: '아이오닉6', model_code: 'CE', manufacturer: '현대', sort_order: 13 },
      { model_name: '팰리세이드', model_code: 'LX2', manufacturer: '현대', sort_order: 14 }
    ];
    
    for (const cm of carModels) {
      const [existing] = await sequelize.query(
        `SELECT id FROM car_models WHERE model_name = '${cm.model_name}'`
      );
      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO car_models (model_name, model_code, manufacturer, sort_order, is_active, created_at, updated_at)
          VALUES ('${cm.model_name}', '${cm.model_code}', '${cm.manufacturer}', ${cm.sort_order}, true, NOW(), NOW())
        `);
        console.log(`  + ${cm.model_name} 추가됨`);
      } else {
        console.log(`  - ${cm.model_name} 이미 존재`);
      }
    }

    // 2. 재질 추가
    console.log('\n[재질 추가]');
    const materials = [
      { material_name: 'S45C', material_code: 'S45C', category: '탄소강', hardness: 'HRC 20-25', sort_order: 10 },
      { material_name: 'SKD11', material_code: 'SKD11', category: '합금공구강', hardness: 'HRC 58-62', sort_order: 11 },
      { material_name: 'SKD61', material_code: 'SKD61', category: '열간금형강', hardness: 'HRC 45-50', sort_order: 12 },
      { material_name: 'STAVAX', material_code: 'STAVAX', category: '스테인리스강', hardness: 'HRC 48-52', sort_order: 13 }
    ];
    
    for (const m of materials) {
      const [existing] = await sequelize.query(
        `SELECT id FROM materials WHERE material_name = '${m.material_name}'`
      );
      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO materials (material_name, material_code, category, hardness, sort_order, is_active, created_at, updated_at)
          VALUES ('${m.material_name}', '${m.material_code}', '${m.category}', '${m.hardness}', ${m.sort_order}, true, NOW(), NOW())
        `);
        console.log(`  + ${m.material_name} 추가됨`);
      } else {
        console.log(`  - ${m.material_name} 이미 존재`);
      }
    }

    // 3. 금형타입 추가
    console.log('\n[금형타입 추가]');
    const moldTypes = [
      { type_name: '프레스금형', type_code: 'PRESS', description: '프레스 성형용 금형', sort_order: 10 },
      { type_name: '다이캐스팅', type_code: 'DIECAST', description: '다이캐스팅 금형', sort_order: 11 },
      { type_name: '블로우금형', type_code: 'BLOW', description: '블로우 성형용 금형', sort_order: 12 }
    ];
    
    for (const mt of moldTypes) {
      const [existing] = await sequelize.query(
        `SELECT id FROM mold_types WHERE type_name = '${mt.type_name}'`
      );
      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO mold_types (type_name, type_code, description, sort_order, is_active, created_at, updated_at)
          VALUES ('${mt.type_name}', '${mt.type_code}', '${mt.description}', ${mt.sort_order}, true, NOW(), NOW())
        `);
        console.log(`  + ${mt.type_name} 추가됨`);
      } else {
        console.log(`  - ${mt.type_name} 이미 존재`);
      }
    }

    // 4. 톤수 추가
    console.log('\n[톤수 추가]');
    const tonnages = [
      { tonnage_value: 50, sort_order: 1 },
      { tonnage_value: 100, sort_order: 2 },
      { tonnage_value: 150, sort_order: 3 },
      { tonnage_value: 200, sort_order: 4 },
      { tonnage_value: 250, sort_order: 5 },
      { tonnage_value: 300, sort_order: 6 },
      { tonnage_value: 350, sort_order: 7 },
      { tonnage_value: 400, sort_order: 8 },
      { tonnage_value: 450, sort_order: 9 },
      { tonnage_value: 500, sort_order: 10 },
      { tonnage_value: 650, sort_order: 11 },
      { tonnage_value: 850, sort_order: 12 },
      { tonnage_value: 1000, sort_order: 13 },
      { tonnage_value: 1300, sort_order: 14 },
      { tonnage_value: 1600, sort_order: 15 },
      { tonnage_value: 2000, sort_order: 16 }
    ];
    
    for (const t of tonnages) {
      const [existing] = await sequelize.query(
        `SELECT id FROM tonnages WHERE tonnage_value = ${t.tonnage_value}`
      );
      if (existing.length === 0) {
        await sequelize.query(`
          INSERT INTO tonnages (tonnage_value, sort_order, is_active, created_at, updated_at)
          VALUES (${t.tonnage_value}, ${t.sort_order}, true, NOW(), NOW())
        `);
        console.log(`  + ${t.tonnage_value}톤 추가됨`);
      } else {
        console.log(`  - ${t.tonnage_value}톤 이미 존재`);
      }
    }

    console.log('\n=== 완료 ===');
    
    // 최종 카운트 확인
    const [carCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM car_models WHERE is_active = true');
    const [matCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM materials WHERE is_active = true');
    const [typeCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM mold_types WHERE is_active = true');
    const [tonCount] = await sequelize.query('SELECT COUNT(*) as cnt FROM tonnages WHERE is_active = true');
    
    console.log(`\n최종 데이터 수:`);
    console.log(`  - 차종: ${carCount[0].cnt}개`);
    console.log(`  - 재질: ${matCount[0].cnt}개`);
    console.log(`  - 금형타입: ${typeCount[0].cnt}개`);
    console.log(`  - 톤수: ${tonCount[0].cnt}개`);

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addTestData();
