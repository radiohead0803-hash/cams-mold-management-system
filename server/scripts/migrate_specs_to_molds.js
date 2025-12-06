/**
 * mold_specifications 데이터를 molds 테이블로 마이그레이션하는 스크립트
 */
const { sequelize } = require('../src/models');

async function migrateSpecsToMolds() {
  try {
    console.log('=== mold_specifications → molds 마이그레이션 시작 ===\n');

    // 1. mold_specifications 테이블 컬럼 확인
    console.log('1. mold_specifications 테이블 확인...');
    const [specColumns] = await sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'mold_specifications' 
      ORDER BY ordinal_position
    `);
    console.log('mold_specifications 컬럼:', specColumns.map(c => c.column_name).join(', '));

    // 2. mold_specifications 데이터 조회
    console.log('\n2. mold_specifications 데이터 조회...');
    const [specs] = await sequelize.query(`
      SELECT * FROM mold_specifications LIMIT 5
    `);
    console.log(`총 ${specs.length}개 샘플 데이터 확인`);
    if (specs.length > 0) {
      console.log('샘플:', JSON.stringify(specs[0], null, 2));
    }

    // 3. 전체 개수 확인
    const [countResult] = await sequelize.query(`SELECT COUNT(*) as cnt FROM mold_specifications`);
    const totalSpecs = countResult[0].cnt;
    console.log(`\n총 ${totalSpecs}개의 mold_specifications 레코드`);

    // 4. 이미 molds에 있는 specification_id 확인
    const [existingMolds] = await sequelize.query(`
      SELECT specification_id FROM molds WHERE specification_id IS NOT NULL
    `);
    const existingSpecIds = existingMolds.map(m => m.specification_id);
    console.log(`이미 molds에 연결된 specification: ${existingSpecIds.length}개`);

    // 5. 마이그레이션 실행
    console.log('\n3. 마이그레이션 실행...');
    
    const [allSpecs] = await sequelize.query(`SELECT * FROM mold_specifications`);
    
    let inserted = 0;
    let skipped = 0;
    let errors = 0;

    for (const spec of allSpecs) {
      // 이미 molds에 있는지 확인 (specification_id 또는 part_number로)
      const moldCode = spec.mold_code || spec.part_number || `P-${spec.id}`;
      const [existing] = await sequelize.query(`
        SELECT id FROM molds 
        WHERE specification_id = :specId 
           OR mold_code = :moldCode
           OR mold_number = :moldCode
      `, {
        replacements: { 
          specId: spec.id, 
          moldCode: moldCode
        }
      });

      if (existing.length > 0) {
        skipped++;
        continue;
      }

      try {
        // molds 테이블에 삽입
        await sequelize.query(`
          INSERT INTO molds (
            mold_code, mold_number, mold_name, car_model, part_name,
            cavity, status, location, specification_id,
            target_shots, current_shots,
            created_at, updated_at
          ) VALUES (
            :mold_code, :mold_number, :mold_name, :car_model, :part_name,
            :cavity, :status, :location, :specification_id,
            :target_shots, 0,
            NOW(), NOW()
          )
        `, {
          replacements: {
            mold_code: moldCode,
            mold_number: moldCode,
            mold_name: spec.mold_name || spec.part_name || null,
            car_model: spec.car_model || null,
            part_name: spec.part_name || spec.part_number || null,
            cavity: spec.cavity || spec.cavity_count || null,
            status: spec.status || 'draft',
            location: spec.current_location || '본사',
            specification_id: spec.id,
            target_shots: spec.target_shots || spec.guaranteed_shots || 500000
          }
        });
        inserted++;
      } catch (err) {
        console.error(`Error inserting spec ${spec.id}:`, err.message);
        errors++;
      }
    }

    console.log(`\n=== 마이그레이션 완료 ===`);
    console.log(`✅ 삽입: ${inserted}개`);
    console.log(`⏭️ 건너뜀 (이미 존재): ${skipped}개`);
    console.log(`❌ 오류: ${errors}개`);

    // 6. 결과 확인
    const [finalCount] = await sequelize.query(`SELECT COUNT(*) as cnt FROM molds`);
    console.log(`\nmolds 테이블 최종 레코드 수: ${finalCount[0].cnt}개`);

  } catch (error) {
    console.error('마이그레이션 오류:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

migrateSpecsToMolds();
