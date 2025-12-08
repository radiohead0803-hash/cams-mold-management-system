/**
 * molds 테이블에 GPS 관련 컬럼 추가 및 데이터 동기화
 */
const { sequelize } = require('../src/models');

async function addGpsColumnsToMolds() {
  try {
    console.log('=== molds 테이블 GPS 컬럼 추가 ===\n');

    // 1. 현재 molds 테이블 컬럼 확인
    console.log('[1. molds 테이블 컬럼 확인]');
    const [columns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns WHERE table_name = 'molds'
    `);
    const columnNames = columns.map(c => c.column_name);
    console.log('  현재 컬럼:', columnNames.join(', '));

    // 2. GPS 관련 컬럼 추가
    console.log('\n[2. GPS 관련 컬럼 추가]');
    
    const gpsColumns = [
      { name: 'last_gps_lat', type: 'DECIMAL(10,7)', comment: '마지막 GPS 위도' },
      { name: 'last_gps_lng', type: 'DECIMAL(10,7)', comment: '마지막 GPS 경도' },
      { name: 'last_gps_time', type: 'TIMESTAMP', comment: '마지막 GPS 기록 시간' },
      { name: 'base_gps_lat', type: 'DECIMAL(10,7)', comment: '기준 GPS 위도' },
      { name: 'base_gps_lng', type: 'DECIMAL(10,7)', comment: '기준 GPS 경도' },
      { name: 'location_status', type: 'VARCHAR(20)', comment: '위치 상태 (normal/moved)' },
      { name: 'location', type: 'VARCHAR(100)', comment: '현재 위치명' },
      { name: 'mold_code', type: 'VARCHAR(50)', comment: '금형 코드' },
      { name: 'mold_name', type: 'VARCHAR(200)', comment: '금형 이름' }
    ];

    for (const col of gpsColumns) {
      if (!columnNames.includes(col.name)) {
        try {
          await sequelize.query(`ALTER TABLE molds ADD COLUMN ${col.name} ${col.type}`);
          console.log(`  + ${col.name} 추가됨`);
        } catch (err) {
          console.log(`  - ${col.name} 이미 존재하거나 오류: ${err.message}`);
        }
      } else {
        console.log(`  - ${col.name} 이미 존재`);
      }
    }

    // 3. 기존 데이터에서 GPS 정보 동기화
    console.log('\n[3. GPS 데이터 동기화]');
    
    // gps_locations에서 molds로 GPS 정보 복사
    const [gpsData] = await sequelize.query(`
      SELECT gl.mold_id, gl.latitude, gl.longitude, gl.recorded_at
      FROM gps_locations gl
      WHERE gl.mold_id IS NOT NULL
    `);
    console.log(`  GPS 데이터: ${gpsData.length}개`);

    for (const gps of gpsData) {
      await sequelize.query(`
        UPDATE molds SET 
          last_gps_lat = ${gps.latitude},
          last_gps_lng = ${gps.longitude},
          last_gps_time = NOW(),
          base_gps_lat = ${gps.latitude},
          base_gps_lng = ${gps.longitude},
          location_status = 'normal'
        WHERE id = ${gps.mold_id}
      `);
    }
    console.log('  GPS 데이터 동기화 완료');

    // 4. mold_code, mold_name, location 채우기
    console.log('\n[4. mold_code, mold_name, location 채우기]');
    
    // mold_number를 mold_code로 복사
    await sequelize.query(`
      UPDATE molds SET mold_code = mold_number WHERE mold_code IS NULL AND mold_number IS NOT NULL
    `);
    
    // part_name을 mold_name으로 복사
    await sequelize.query(`
      UPDATE molds SET mold_name = part_name WHERE mold_name IS NULL AND part_name IS NOT NULL
    `);
    
    // current_location을 location으로 복사
    await sequelize.query(`
      UPDATE molds SET location = current_location WHERE location IS NULL AND current_location IS NOT NULL
    `);
    
    // location이 없으면 '본사'로 설정
    await sequelize.query(`
      UPDATE molds SET location = '본사' WHERE location IS NULL
    `);
    
    // location_status가 없으면 'normal'로 설정
    await sequelize.query(`
      UPDATE molds SET location_status = 'normal' WHERE location_status IS NULL
    `);
    
    console.log('  데이터 채우기 완료');

    // 5. 최종 확인
    console.log('\n[5. 최종 확인]');
    const [finalCheck] = await sequelize.query(`
      SELECT COUNT(*) as total,
             COUNT(last_gps_lat) as with_gps,
             COUNT(mold_code) as with_code,
             COUNT(location) as with_location
      FROM molds
    `);
    console.log(`  총 금형: ${finalCheck[0].total}개`);
    console.log(`  GPS 좌표 있음: ${finalCheck[0].with_gps}개`);
    console.log(`  mold_code 있음: ${finalCheck[0].with_code}개`);
    console.log(`  location 있음: ${finalCheck[0].with_location}개`);

    console.log('\n=== 완료 ===');

  } catch (error) {
    console.error('오류:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addGpsColumnsToMolds();
