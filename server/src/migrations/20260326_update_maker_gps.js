'use strict';

/**
 * 금형제조업체 16개사 GPS 좌표 업데이트
 * - 업체 주소 기반 위도/경도 반영
 * - 금형(molds) 테이블의 base_gps_lat/lng에도 제작처 좌표 연동
 */

const MAKER_GPS = [
  // code, latitude, longitude (보정 완료)
  ['E0018', 37.2099, 126.8219],  // 제일솔루텍 - 화성시 남양읍
  ['C5389', 35.1293, 126.7924],  // 현태금형 - 광주 광산구 하남산단
  ['C1134', 35.1901, 126.8988],  // 상봉정밀 - 광주 북구 월출동
  ['C1531', 35.1493, 126.7935],  // 제일산기 - 광주 광산구 도천동
  ['C1853', 35.2200, 126.8500],  // 아이앤테크 - 광주 북구 첨단연신로
  ['C1133', 35.5824, 129.3605],  // 한국몰드 - 울산 북구 단청동
  ['C2406', 37.4035, 126.6949],  // 두성정공 - 인천 남동구 남동공단
  ['E0191', 35.1593, 128.9330],  // 에스엠정밀기술 - 부산 강서구 과학산단
  ['C6425', 37.0890, 126.9627],  // 창대정밀 - 화성시 양감면
  ['C7853', 35.5824, 129.3605],  // 동신산업(울산) - 울산 북구 매곡산업
  ['C0809', 36.9613, 127.0440],  // 동신산업(평택) - 평택시 팽성읍
  ['C1308', 35.3043, 128.7331],  // 신혁2공장 - 김해시 진영읍
  ['C1354', 35.5824, 129.3605],  // 진흥공업 - 울산 북구 매곡동
  ['E0239', 35.7123, 129.3249],  // 디에스메탈 - 경주시 외동읍
  ['E0249', 35.1500, 126.8300],  // 에스에스몰드 - 광주 광산구 진곡산단
  ['E0198', 35.1165, 126.7340],  // 제일이앤티 - 광주 광산구 평동산단
];

module.exports = {
  async up(queryInterface, Sequelize) {
    const { sequelize } = queryInterface;

    // 1) 업체(companies) GPS 좌표 업데이트
    for (const [code, lat, lng] of MAKER_GPS) {
      await sequelize.query(`
        UPDATE companies
        SET latitude = $1, longitude = $2, updated_at = NOW()
        WHERE company_code = $3
      `, { bind: [lat, lng, code] });
    }

    // 2) 해당 업체가 제작처인 금형(molds)의 base_gps 좌표 연동
    //    금형의 기본 위치를 제작처 위치로 설정 (base_gps가 비어있는 경우에만)
    await sequelize.query(`
      UPDATE molds m
      SET
        base_gps_lat = c.latitude,
        base_gps_lng = c.longitude,
        updated_at = NOW()
      FROM companies c
      WHERE m.maker_company_id = c.id
        AND c.latitude IS NOT NULL
        AND c.longitude IS NOT NULL
        AND m.base_gps_lat IS NULL
    `);

    // 3) 금형의 현재 위치도 비어있으면 제작처 좌표로 초기화
    await sequelize.query(`
      UPDATE molds m
      SET
        last_gps_lat = c.latitude,
        last_gps_lng = c.longitude,
        last_gps_time = NOW(),
        last_gps_source = 'company_address',
        location_status = 'normal',
        updated_at = NOW()
      FROM companies c
      WHERE m.maker_company_id = c.id
        AND c.latitude IS NOT NULL
        AND c.longitude IS NOT NULL
        AND m.last_gps_lat IS NULL
    `);

    // 4) 생산처(plant) 업체의 좌표가 있으면, 해당 생산처 금형도 연동
    await sequelize.query(`
      UPDATE molds m
      SET
        base_gps_lat = COALESCE(m.base_gps_lat, c.latitude),
        base_gps_lng = COALESCE(m.base_gps_lng, c.longitude),
        last_gps_lat = COALESCE(m.last_gps_lat, c.latitude),
        last_gps_lng = COALESCE(m.last_gps_lng, c.longitude),
        last_gps_time = COALESCE(m.last_gps_time, NOW()),
        last_gps_source = COALESCE(m.last_gps_source, 'company_address'),
        updated_at = NOW()
      FROM companies c
      WHERE m.plant_company_id = c.id
        AND c.latitude IS NOT NULL
        AND c.longitude IS NOT NULL
        AND m.last_gps_lat IS NULL
    `);

    console.log(`✅ ${MAKER_GPS.length}개 제조업체 GPS 좌표 반영 + 금형 위치 연동 완료`);
  },

  async down(queryInterface) {
    const { sequelize } = queryInterface;
    const codes = MAKER_GPS.map(g => `'${g[0]}'`).join(',');
    await sequelize.query(`
      UPDATE companies SET latitude = NULL, longitude = NULL
      WHERE company_code IN (${codes})
    `);
  }
};
