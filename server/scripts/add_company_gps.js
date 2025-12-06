/**
 * 업체 GPS 정보 추가 스크립트
 */
const { sequelize } = require('../src/models');

async function addCompanyGPS() {
  try {
    console.log('=== 업체 GPS 정보 추가 ===\n');

    // 1. 현재 companies 테이블의 GPS 관련 컬럼 확인
    const [columns] = await sequelize.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'companies' 
      AND column_name IN ('latitude', 'longitude')
    `);
    console.log('GPS 컬럼 존재 여부:', columns.map(c => c.column_name));

    // 2. 업체별 GPS 좌표 데이터 (한국 실제 위치 기반)
    const companyGPSData = [
      // 제작처 (maker)
      { id: 1, name: '지금강(장성)', lat: 35.0197, lng: 126.7847, address: '전라남도 장성군' },
      { id: 2, name: '한국몰드', lat: 37.4563, lng: 126.7052, address: '경기도 시흥시' },
      { id: 3, name: '서울금형산업', lat: 37.5665, lng: 126.9780, address: '서울특별시' },
      { id: 9, name: '상봉정밀', lat: 35.1796, lng: 129.0756, address: '부산광역시' },
      
      // 생산처 (plant)
      { id: 4, name: '현대자동차 울산공장', lat: 35.5384, lng: 129.3114, address: '울산광역시 북구' },
      { id: 5, name: '기아자동차 화성공장', lat: 37.1699, lng: 126.8313, address: '경기도 화성시' },
      { id: 6, name: '아이엔테크', lat: 36.8065, lng: 127.1522, address: '충청남도 천안시' },
      { id: 7, name: '제일솔루텍', lat: 35.8714, lng: 128.6014, address: '대구광역시' },
      { id: 8, name: '신성화학', lat: 35.9078, lng: 128.8097, address: '경상북도 경산시' }
    ];

    // 3. GPS 정보 업데이트
    console.log('\n업체 GPS 정보 업데이트:');
    for (const company of companyGPSData) {
      try {
        await sequelize.query(`
          UPDATE companies 
          SET latitude = $1, longitude = $2, address = $3, updated_at = NOW()
          WHERE id = $4
        `, {
          bind: [company.lat, company.lng, company.address, company.id]
        });
        console.log(`  ✅ [${company.id}] ${company.name}: (${company.lat}, ${company.lng})`);
      } catch (err) {
        console.log(`  ❌ [${company.id}] ${company.name}: ${err.message}`);
      }
    }

    // 4. 결과 확인
    console.log('\n=== 업데이트 결과 ===');
    const [companies] = await sequelize.query(`
      SELECT id, company_name, company_type, address, latitude, longitude 
      FROM companies 
      ORDER BY company_type, id
    `);

    console.log('\n업체 GPS 정보:');
    console.log('─'.repeat(80));
    console.log('ID | 업체명                    | 유형   | 주소              | 위도      | 경도');
    console.log('─'.repeat(80));
    
    companies.forEach(c => {
      const name = (c.company_name || '').padEnd(20);
      const type = (c.company_type || '').padEnd(6);
      const addr = (c.address || '-').padEnd(15);
      const lat = c.latitude ? c.latitude.toFixed(4) : '-';
      const lng = c.longitude ? c.longitude.toFixed(4) : '-';
      console.log(`${c.id.toString().padStart(2)} | ${name} | ${type} | ${addr} | ${lat.padStart(8)} | ${lng}`);
    });

    // 5. GPS 정보가 있는 업체 수
    const [gpsCount] = await sequelize.query(`
      SELECT COUNT(*) as cnt FROM companies 
      WHERE latitude IS NOT NULL AND longitude IS NOT NULL
    `);
    console.log(`\nGPS 정보가 있는 업체: ${gpsCount[0].cnt}개 / 총 ${companies.length}개`);

  } catch (error) {
    console.error('오류:', error);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

addCompanyGPS();
