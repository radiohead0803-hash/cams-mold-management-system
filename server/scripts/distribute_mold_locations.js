/**
 * 금형 위치 분산 스크립트
 * 다양한 공장 위치로 금형 분산
 */
const { sequelize } = require('../src/models');

async function distributeMoldLocations() {
  try {
    console.log('=== 금형 위치 분산 ===\n');

    // 한국 주요 자동차 공장 위치
    const locations = [
      { name: '본사', lat: 37.5665, lng: 126.9780, status: 'normal' },
      { name: '현대 울산공장', lat: 35.5384, lng: 129.3114, status: 'normal' },
      { name: '기아 화성공장', lat: 37.2636, lng: 126.9780, status: 'normal' },
      { name: '현대 아산공장', lat: 36.7836, lng: 127.0660, status: 'normal' },
      { name: '기아 광주공장', lat: 35.1595, lng: 126.8526, status: 'normal' },
      { name: '제작처A', lat: 37.4563, lng: 126.7052, status: 'normal' },
      { name: '제작처B', lat: 35.8714, lng: 128.6014, status: 'normal' },
      { name: '이동중', lat: 36.3504, lng: 127.3845, status: 'moved' },
      { name: '외부창고', lat: 37.3943, lng: 127.1103, status: 'moved' }
    ];

    // 모든 금형 조회
    const [molds] = await sequelize.query(`SELECT id, mold_code FROM molds ORDER BY id`);
    console.log(`총 금형: ${molds.length}개\n`);

    // 금형을 위치별로 분산
    for (let i = 0; i < molds.length; i++) {
      const mold = molds[i];
      const loc = locations[i % locations.length];
      
      // 약간의 랜덤 오프셋 추가 (같은 위치에 겹치지 않도록)
      const latOffset = (Math.random() - 0.5) * 0.01;
      const lngOffset = (Math.random() - 0.5) * 0.01;
      
      await sequelize.query(`
        UPDATE molds SET 
          last_gps_lat = ${loc.lat + latOffset},
          last_gps_lng = ${loc.lng + lngOffset},
          base_gps_lat = ${loc.lat},
          base_gps_lng = ${loc.lng},
          location = '${loc.name}',
          location_status = '${loc.status}',
          last_gps_time = NOW()
        WHERE id = ${mold.id}
      `);
      
      if (i < 10) {
        console.log(`  ${mold.mold_code} → ${loc.name} (${loc.status})`);
      }
    }
    if (molds.length > 10) {
      console.log(`  ... 외 ${molds.length - 10}개`);
    }

    // 최종 확인
    console.log('\n[위치별 금형 수]');
    const [locationCounts] = await sequelize.query(`
      SELECT location, location_status, COUNT(*) as cnt 
      FROM molds 
      GROUP BY location, location_status 
      ORDER BY cnt DESC
    `);
    locationCounts.forEach(l => {
      console.log(`  ${l.location} (${l.location_status}): ${l.cnt}개`);
    });

    console.log('\n=== 완료 ===');

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

distributeMoldLocations();
