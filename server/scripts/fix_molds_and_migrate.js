/**
 * molds 테이블 스키마 수정 및 mold_specifications 데이터 마이그레이션
 */
const { sequelize } = require('../src/models');

async function fixMoldsAndMigrate() {
  try {
    console.log('=== molds 테이블 스키마 수정 및 마이그레이션 ===\n');

    // 1. 누락된 컬럼 추가
    console.log('1. 누락된 컬럼 추가...');
    const columnsToAdd = [
      { name: 'car_model_id', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS car_model_id INTEGER REFERENCES car_models(id)' },
      { name: 'material_id', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS material_id INTEGER REFERENCES materials(id)' },
      { name: 'mold_type_id', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS mold_type_id INTEGER REFERENCES mold_types(id)' },
      { name: 'tonnage_id', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS tonnage_id INTEGER REFERENCES tonnages(id)' },
      { name: 'material', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS material VARCHAR(100)' },
      { name: 'mold_type', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS mold_type VARCHAR(100)' },
      { name: 'tonnage', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS tonnage INTEGER' },
      { name: 'weight', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS weight DECIMAL(10,2)' },
      { name: 'product_name', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS product_name VARCHAR(255)' },
      { name: 'current_location', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS current_location VARCHAR(255)' },
      { name: 'total_shots', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS total_shots INTEGER DEFAULT 0' },
      { name: 'cavity_count', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS cavity_count INTEGER' },
      { name: 'qr_code', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255)' },
      { name: 'latitude', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION' },
      { name: 'longitude', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION' },
      { name: 'is_out_of_area', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS is_out_of_area BOOLEAN DEFAULT FALSE' },
      { name: 'current_location_company_id', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS current_location_company_id INTEGER' },
      { name: 'part_number', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS part_number VARCHAR(100)' },
      { name: 'car_year', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS car_year VARCHAR(10)' },
      { name: 'development_stage', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS development_stage VARCHAR(50)' },
      { name: 'production_stage', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS production_stage VARCHAR(50)' },
      { name: 'order_date', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS order_date DATE' },
      { name: 'target_delivery_date', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS target_delivery_date DATE' },
      { name: 'estimated_cost', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(15,2)' },
      { name: 'notes', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS notes TEXT' },
      { name: 'created_by', sql: 'ALTER TABLE molds ADD COLUMN IF NOT EXISTS created_by INTEGER' }
    ];

    for (const col of columnsToAdd) {
      try {
        await sequelize.query(col.sql);
        console.log(`  ✅ ${col.name}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
          console.log(`  ⏭️ ${col.name} (이미 존재)`);
        } else {
          console.log(`  ❌ ${col.name}: ${err.message}`);
        }
      }
    }

    // 2. mold_specifications 데이터 마이그레이션
    console.log('\n2. mold_specifications → molds 마이그레이션...');
    
    const [allSpecs] = await sequelize.query(`SELECT * FROM mold_specifications`);
    console.log(`   총 ${allSpecs.length}개의 mold_specifications 레코드`);
    
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const spec of allSpecs) {
      const moldCode = spec.mold_code || spec.part_number || `P-${spec.id}`;
      
      // 이미 존재하는지 확인
      const [existing] = await sequelize.query(`
        SELECT id FROM molds 
        WHERE specification_id = $1 
           OR mold_code = $2
           OR mold_number = $2
      `, {
        bind: [spec.id, moldCode]
      });

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      try {
        await sequelize.query(`
          INSERT INTO molds (
            mold_code, mold_number, mold_name, car_model, part_name, part_number,
            cavity, cavity_count, status, location, current_location, specification_id,
            target_shots, current_shots, total_shots,
            material, mold_type, tonnage,
            car_year, development_stage, production_stage,
            order_date, target_delivery_date, estimated_cost, notes,
            maker_company_id, plant_company_id, created_by,
            created_at, updated_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6,
            $7, $8, $9, $10, $11, $12,
            $13, 0, 0,
            $14, $15, $16,
            $17, $18, $19,
            $20, $21, $22, $23,
            $24, $25, $26,
            NOW(), NOW()
          )
        `, {
          bind: [
            moldCode,                                    // $1 mold_code
            moldCode,                                    // $2 mold_number
            spec.part_name || null,                      // $3 mold_name
            spec.car_model || null,                      // $4 car_model
            spec.part_name || null,                      // $5 part_name
            spec.part_number || null,                    // $6 part_number
            spec.cavity_count || null,                   // $7 cavity
            spec.cavity_count || null,                   // $8 cavity_count
            spec.status || 'draft',                      // $9 status
            '본사',                                       // $10 location
            '본사',                                       // $11 current_location
            spec.id,                                     // $12 specification_id
            500000,                                      // $13 target_shots
            spec.material || null,                       // $14 material
            spec.mold_type || null,                      // $15 mold_type
            spec.tonnage || null,                        // $16 tonnage
            spec.car_year || null,                       // $17 car_year
            spec.development_stage || null,              // $18 development_stage
            spec.production_stage || null,               // $19 production_stage
            spec.order_date || null,                     // $20 order_date
            spec.target_delivery_date || null,           // $21 target_delivery_date
            spec.estimated_cost || null,                 // $22 estimated_cost
            spec.notes || null,                          // $23 notes
            spec.maker_company_id || null,               // $24 maker_company_id
            spec.plant_company_id || null,               // $25 plant_company_id
            spec.created_by || null                      // $26 created_by
          ]
        });
        inserted++;
      } catch (err) {
        console.error(`   ❌ spec ${spec.id} (${moldCode}): ${err.message}`);
        errors++;
      }
    }

    console.log(`\n=== 마이그레이션 완료 ===`);
    console.log(`✅ 삽입: ${inserted}개`);
    console.log(`⏭️ 건너뜀: ${skipped}개`);
    console.log(`❌ 오류: ${errors}개`);

    // 3. 결과 확인
    const [finalCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM molds`);
    console.log(`\nmolds 테이블 최종 레코드 수: ${finalCount[0].cnt}개`);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

fixMoldsAndMigrate();
