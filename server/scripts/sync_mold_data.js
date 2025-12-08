/**
 * 금형 데이터 동기화 스크립트
 * 1. mold_specifications에 mold_code 채우기
 * 2. mold_specifications와 molds 연결
 * 3. gps_locations 데이터 생성
 */
const { sequelize } = require('../src/models');

async function syncMoldData() {
  try {
    console.log('=== 금형 데이터 동기화 ===\n');

    // 1. gps_locations 테이블 구조 확인
    console.log('[1. gps_locations 테이블 구조 확인]');
    const [gpsColumns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'gps_locations'
    `);
    console.log('  컬럼:', gpsColumns.map(c => c.column_name).join(', '));

    // 2. mold_specifications에 mold_code 채우기
    console.log('\n[2. mold_specifications mold_code 채우기]');
    const [specsWithoutCode] = await sequelize.query(`
      SELECT id, part_name FROM mold_specifications WHERE mold_code IS NULL
    `);
    console.log(`  mold_code가 NULL인 항목: ${specsWithoutCode.length}개`);
    
    for (const spec of specsWithoutCode) {
      const moldCode = `M-2025-${String(spec.id).padStart(3, '0')}`;
      await sequelize.query(`UPDATE mold_specifications SET mold_code = '${moldCode}' WHERE id = ${spec.id}`);
    }
    console.log('  mold_code 업데이트 완료');

    // 3. mold_specifications와 molds 연결 확인 및 업데이트
    console.log('\n[3. mold_specifications와 molds 연결]');
    const [unlinkedSpecs] = await sequelize.query(`
      SELECT ms.id, ms.mold_code, ms.part_name, ms.mold_id
      FROM mold_specifications ms
      WHERE ms.mold_id IS NULL
    `);
    console.log(`  mold_id가 NULL인 항목: ${unlinkedSpecs.length}개`);

    // part_name으로 매칭 시도
    for (const spec of unlinkedSpecs) {
      const [matchingMolds] = await sequelize.query(`
        SELECT id FROM molds WHERE part_name = '${spec.part_name.replace(/'/g, "''")}'
        LIMIT 1
      `);
      if (matchingMolds.length > 0) {
        await sequelize.query(`UPDATE mold_specifications SET mold_id = ${matchingMolds[0].id} WHERE id = ${spec.id}`);
      }
    }
    console.log('  연결 업데이트 완료');

    // 4. mold_specifications의 current_location 채우기
    console.log('\n[4. current_location 채우기]');
    await sequelize.query(`
      UPDATE mold_specifications SET current_location = '본사' WHERE current_location IS NULL
    `);
    console.log('  current_location 업데이트 완료');

    // 5. gps_locations에 모든 금형 위치 추가
    console.log('\n[5. gps_locations 데이터 생성]');
    
    // 기존 gps_locations 확인
    const [existingGps] = await sequelize.query(`SELECT mold_id FROM gps_locations`);
    const existingMoldIds = new Set(existingGps.map(g => g.mold_id));
    console.log(`  기존 GPS 위치: ${existingGps.length}개`);

    // molds 테이블에서 GPS 위치 없는 금형 추가
    const [moldsWithoutGps] = await sequelize.query(`
      SELECT id, mold_number, part_name, current_location 
      FROM molds 
      WHERE id NOT IN (SELECT mold_id FROM gps_locations WHERE mold_id IS NOT NULL)
    `);
    console.log(`  GPS 위치 없는 금형: ${moldsWithoutGps.length}개`);

    // 본사 좌표 (기본값)
    const defaultLat = 37.5665;
    const defaultLng = 126.9780;

    for (const mold of moldsWithoutGps) {
      await sequelize.query(`
        INSERT INTO gps_locations (mold_id, latitude, longitude, location_type, is_valid, recorded_at, created_at, updated_at)
        VALUES (${mold.id}, ${defaultLat}, ${defaultLng}, 'manual', true, NOW(), NOW(), NOW())
      `);
    }
    console.log('  GPS 위치 추가 완료');

    // 6. 최종 확인
    console.log('\n[6. 최종 확인]');
    const [finalSpecs] = await sequelize.query(`SELECT COUNT(*) as cnt FROM mold_specifications WHERE mold_code IS NOT NULL`);
    const [finalGps] = await sequelize.query(`SELECT COUNT(*) as cnt FROM gps_locations`);
    const [finalMolds] = await sequelize.query(`SELECT COUNT(*) as cnt FROM molds`);
    
    console.log(`  mold_specifications (mold_code 있음): ${finalSpecs[0].cnt}개`);
    console.log(`  molds: ${finalMolds[0].cnt}개`);
    console.log(`  gps_locations (현재 위치): ${finalGps[0].cnt}개`);

    console.log('\n=== 동기화 완료 ===');

  } catch (error) {
    console.error('오류:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

syncMoldData();
