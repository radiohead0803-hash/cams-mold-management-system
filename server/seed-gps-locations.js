/**
 * GPS 위치 정보 시드 스크립트
 * 한국 주요 도시의 실제 좌표로 금형 위치 추가
 */

const { sequelize } = require('./src/models/newIndex');

// 한국 주요 자동차 공장 실제 GPS 좌표
const locations = [
  { name: '현대자동차 울산공장', lat: 35.5384, lng: 129.3114, city: '울산' },
  { name: '기아자동차 화성공장', lat: 37.2636, lng: 126.9780, city: '화성' },
  { name: 'GM 부평공장', lat: 37.5085, lng: 126.7224, city: '인천' },
  { name: '르노삼성 부산공장', lat: 35.0995, lng: 128.9903, city: '부산' },
  { name: '쌍용자동차 평택공장', lat: 36.9921, lng: 127.0889, city: '평택' },
  { name: '현대자동차 아산공장', lat: 36.7836, lng: 127.0660, city: '아산' },
  { name: '기아자동차 소하리공장', lat: 37.2411, lng: 126.9644, city: '화성' },
  { name: '현대자동차 전주공장', lat: 35.8242, lng: 127.1478, city: '전주' },
  { name: '한국GM 창원공장', lat: 35.2281, lng: 128.6811, city: '창원' },
  { name: '현대자동차 남양연구소', lat: 37.2656, lng: 126.9850, city: '화성' }
];

async function seedGPSLocations() {
  try {
    console.log('🌍 Starting GPS location seeding...\n');

    // 기존 금형 조회
    const [molds] = await sequelize.query('SELECT id, mold_code, mold_name FROM molds LIMIT 10');
    
    if (molds.length === 0) {
      console.log('⚠️  No molds found. Please run seed-data.js first.');
      return;
    }

    console.log(`📍 Found ${molds.length} molds\n`);

    // 각 금형에 GPS 위치 할당
    for (let i = 0; i < molds.length; i++) {
      const mold = molds[i];
      const location = locations[i % locations.length];
      
      // 약간의 랜덤 오프셋 추가 (같은 공장 내 다른 위치)
      const latOffset = (Math.random() - 0.5) * 0.01; // ±0.005도 (약 ±500m)
      const lngOffset = (Math.random() - 0.5) * 0.01;
      
      const finalLat = location.lat + latOffset;
      const finalLng = location.lng + lngOffset;
      
      // GPS 위치 삽입
      await sequelize.query(`
        INSERT INTO gps_locations (
          mold_id, latitude, longitude, accuracy, 
          recorded_at, location_type, is_valid, 
          created_at, updated_at
        ) VALUES (
          ${mold.id},
          ${finalLat},
          ${finalLng},
          ${5 + Math.random() * 5},
          NOW() - INTERVAL '${Math.floor(Math.random() * 24)} hours',
          'plant',
          true,
          NOW(),
          NOW()
        )
        ON CONFLICT (mold_id) 
        DO UPDATE SET
          latitude = ${finalLat},
          longitude = ${finalLng},
          recorded_at = NOW(),
          updated_at = NOW()
      `);

      // Mold 테이블에도 현재 위치 업데이트
      await sequelize.query(`
        UPDATE molds 
        SET 
          current_latitude = ${finalLat},
          current_longitude = ${finalLng},
          updated_at = NOW()
        WHERE id = ${mold.id}
      `);

      console.log(`  ✅ ${mold.mold_code}: ${location.name} (${finalLat.toFixed(4)}, ${finalLng.toFixed(4)})`);
    }

    // 위치 이탈 테스트 데이터 (2개)
    console.log('\n⚠️  Adding drift test data...');
    
    if (molds.length >= 2) {
      // 첫 번째 금형: 서울 (정상 위치에서 멀리 떨어진 곳)
      await sequelize.query(`
        INSERT INTO gps_locations (
          mold_id, latitude, longitude, accuracy,
          recorded_at, location_type, is_valid,
          created_at, updated_at
        ) VALUES (
          ${molds[0].id},
          37.5665,
          126.9780,
          10,
          NOW(),
          'unknown',
          false,
          NOW(),
          NOW()
        )
        ON CONFLICT (mold_id)
        DO UPDATE SET
          latitude = 37.5665,
          longitude = 126.9780,
          location_type = 'unknown',
          is_valid = false,
          recorded_at = NOW(),
          updated_at = NOW()
      `);
      console.log(`  🔴 ${molds[0].mold_code}: 위치 이탈 (서울 시청)`);

      // 두 번째 금형: 제주도 (비정상 위치)
      await sequelize.query(`
        INSERT INTO gps_locations (
          mold_id, latitude, longitude, accuracy,
          recorded_at, location_type, is_valid,
          created_at, updated_at
        ) VALUES (
          ${molds[1].id},
          33.4996,
          126.5312,
          15,
          NOW(),
          'unknown',
          false,
          NOW(),
          NOW()
        )
        ON CONFLICT (mold_id)
        DO UPDATE SET
          latitude = 33.4996,
          longitude = 126.5312,
          location_type = 'unknown',
          is_valid = false,
          recorded_at = NOW(),
          updated_at = NOW()
      `);
      console.log(`  🔴 ${molds[1].mold_code}: 위치 이탈 (제주도)`);
    }

    console.log('\n✅ GPS location seeding completed!');
    console.log('\n📊 Summary:');
    console.log(`  - Total locations: ${molds.length}`);
    console.log(`  - Normal locations: ${molds.length - 2}`);
    console.log(`  - Drift locations: 2`);
    console.log('\n🗺️  Locations:');
    locations.forEach((loc, idx) => {
      if (idx < molds.length) {
        console.log(`  ${idx + 1}. ${loc.name} (${loc.city})`);
      }
    });

  } catch (error) {
    console.error('❌ GPS seeding error:', error);
    console.error('Stack:', error.stack);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// 실행
seedGPSLocations()
  .then(() => {
    console.log('\n✅ GPS seeding process completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ GPS seeding process failed:', error);
    process.exit(1);
  });
