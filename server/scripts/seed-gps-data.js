/**
 * GPS 위치 테스트 데이터 생성 스크립트
 * 실제 한국 자동차 공장 GPS 좌표를 사용하여 금형 위치 데이터 생성
 */

const { Mold, MoldLocationLog } = require('../src/models');

// 한국 주요 자동차 공장 GPS 좌표
const PLANT_LOCATIONS = {
  ulsan: { name: '현대 울산공장', lat: 35.5384, lng: 129.3114 },
  hwaseong: { name: '기아 화성공장', lat: 37.2636, lng: 126.9780 },
  bupyeong: { name: 'GM 부평공장', lat: 37.5085, lng: 126.7224 },
  busan: { name: '르노삼성 부산공장', lat: 35.0995, lng: 128.9903 },
  pyeongtaek: { name: '쌍용 평택공장', lat: 36.9921, lng: 127.0889 },
  asan: { name: '현대 아산공장', lat: 36.7836, lng: 127.0660 },
  sohari: { name: '기아 소하리공장', lat: 37.2411, lng: 126.9644 },
  jeonju: { name: '현대 전주공장', lat: 35.8242, lng: 127.1478 }
};

// 약간 이탈된 위치 생성 (100-500m 범위)
function generateDriftedLocation(baseLat, baseLng, driftMeters = 200) {
  // 1도 = 약 111km
  const latOffset = (driftMeters / 111000) * (Math.random() > 0.5 ? 1 : -1);
  const lngOffset = (driftMeters / (111000 * Math.cos(baseLat * Math.PI / 180))) * (Math.random() > 0.5 ? 1 : -1);
  
  return {
    lat: baseLat + latOffset,
    lng: baseLng + lngOffset
  };
}

async function seedGPSData() {
  try {
    console.log('🌍 GPS 위치 테스트 데이터 생성 시작...\n');

    // 1. 기존 금형 조회
    const molds = await Mold.findAll({
      limit: 10,
      order: [['id', 'ASC']]
    });

    if (molds.length === 0) {
      console.log('⚠️  금형 데이터가 없습니다. 먼저 금형을 생성해주세요.');
      return;
    }

    console.log(`✅ ${molds.length}개 금형 발견\n`);

    const plantKeys = Object.keys(PLANT_LOCATIONS);
    let normalCount = 0;
    let movedCount = 0;

    // 2. 각 금형에 GPS 위치 할당
    for (let i = 0; i < molds.length; i++) {
      const mold = molds[i];
      const plantKey = plantKeys[i % plantKeys.length];
      const plant = PLANT_LOCATIONS[plantKey];
      
      // 70% 정상, 30% 이탈
      const isDrifted = Math.random() > 0.7;
      
      let currentLat, currentLng, status;
      
      if (isDrifted) {
        // 이탈된 위치 (300-600m)
        const drifted = generateDriftedLocation(plant.lat, plant.lng, 300 + Math.random() * 300);
        currentLat = drifted.lat;
        currentLng = drifted.lng;
        status = 'moved';
        movedCount++;
        console.log(`🔴 [이탈] ${mold.mold_code} - ${plant.name} (${Math.round(300 + Math.random() * 300)}m 이탈)`);
      } else {
        // 정상 위치 (0-100m 오차)
        const normal = generateDriftedLocation(plant.lat, plant.lng, Math.random() * 100);
        currentLat = normal.lat;
        currentLng = normal.lng;
        status = 'normal';
        normalCount++;
        console.log(`🟢 [정상] ${mold.mold_code} - ${plant.name}`);
      }

      // 3. 금형 GPS 정보 업데이트
      await mold.update({
        base_gps_lat: plant.lat,
        base_gps_lng: plant.lng,
        last_gps_lat: currentLat,
        last_gps_lng: currentLng,
        last_gps_time: new Date(),
        location_status: status,
        location: plant.name
      });

      // 4. 위치 로그 생성 (최근 3일간의 로그)
      const logCount = 3 + Math.floor(Math.random() * 5); // 3-7개 로그
      
      for (let j = 0; j < logCount; j++) {
        const daysAgo = j;
        const scannedAt = new Date();
        scannedAt.setDate(scannedAt.getDate() - daysAgo);
        scannedAt.setHours(9 + Math.floor(Math.random() * 8)); // 9-17시
        
        // 시간이 지날수록 점점 이탈
        const drift = isDrifted ? (j * 100) : (Math.random() * 50);
        const logLoc = generateDriftedLocation(plant.lat, plant.lng, drift);
        
        await MoldLocationLog.create({
          mold_id: mold.id,
          plant_id: null,
          scanned_by_id: null,
          scanned_at: scannedAt,
          gps_lat: logLoc.lat,
          gps_lng: logLoc.lng,
          distance_m: Math.round(drift),
          status: drift > 300 ? 'moved' : 'normal',
          source: 'qr_scan',
          notes: `테스트 데이터 - ${j}일 전 스캔`
        });
      }
    }

    console.log('\n✅ GPS 위치 데이터 생성 완료!');
    console.log(`   - 정상 위치: ${normalCount}개`);
    console.log(`   - 위치 이탈: ${movedCount}개`);
    console.log(`   - 총 로그: ${molds.length * 5}개 (평균)\n`);

  } catch (error) {
    console.error('❌ 데이터 생성 실패:', error);
    throw error;
  }
}

// 스크립트 실행
if (require.main === module) {
  seedGPSData()
    .then(() => {
      console.log('🎉 완료!');
      process.exit(0);
    })
    .catch(err => {
      console.error('💥 에러:', err);
      process.exit(1);
    });
}

module.exports = { seedGPSData };
