const { Sequelize } = require('sequelize');
const config = require('./src/config/database');

const env = process.env.NODE_ENV || 'production';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, {
  ...dbConfig,
  logging: false
});

async function testCompaniesAPI() {
  try {
    await sequelize.authenticate();
    console.log('\n✅ 데이터베이스 연결 성공\n');
    
    // companies 테이블 확인
    const [companies] = await sequelize.query(`
      SELECT 
        id,
        company_code,
        company_name,
        company_type,
        phone,
        manager_name,
        rating,
        total_molds,
        active_molds,
        is_active
      FROM companies 
      ORDER BY company_type, id;
    `);

    console.log('📊 Companies 테이블 데이터:\n');
    
    if (companies.length === 0) {
      console.log('❌ companies 테이블에 데이터가 없습니다!\n');
      console.log('시딩을 실행해야 합니다:');
      console.log('  railway run npm run seed\n');
      return;
    }

    console.log(`✅ 총 ${companies.length}개의 업체 데이터 확인\n`);
    
    console.log('┌─────┬─────────────┬──────────────────────┬──────────┬───────────────┬─────────┬────────┐');
    console.log('│ ID  │ Code        │ Name                 │ Type     │ Manager       │ Rating  │ Molds  │');
    console.log('├─────┼─────────────┼──────────────────────┼──────────┼───────────────┼─────────┼────────┤');
    
    companies.forEach(c => {
      const type = c.company_type === 'maker' ? '🏭 제작처' : '🏢 생산처';
      const rating = c.rating ? `⭐ ${parseFloat(c.rating).toFixed(1)}` : '-';
      const active = c.is_active ? '✅' : '❌';
      
      console.log(
        `│ ${String(c.id).padEnd(3)} │ ${c.company_code.padEnd(11)} │ ${c.company_name.padEnd(20)} │ ${type.padEnd(8)} │ ${(c.manager_name || '-').padEnd(13)} │ ${rating.padEnd(7)} │ ${String(c.total_molds || 0).padEnd(6)} │`
      );
    });
    
    console.log('└─────┴─────────────┴──────────────────────┴──────────┴───────────────┴─────────┴────────┘');
    
    // API 응답 형식 테스트
    console.log('\n📋 API 응답 형식 테스트:\n');
    
    const apiResponse = {
      success: true,
      data: {
        items: companies,
        total: companies.length,
        page: 1,
        limit: 100
      }
    };
    
    console.log('API 응답 구조:');
    console.log(JSON.stringify(apiResponse, null, 2).substring(0, 500) + '...\n');
    
    // 통계
    const makers = companies.filter(c => c.company_type === 'maker').length;
    const plants = companies.filter(c => c.company_type === 'plant').length;
    const active = companies.filter(c => c.is_active).length;
    
    console.log('📈 통계:');
    console.log(`  제작처: ${makers}개`);
    console.log(`  생산처: ${plants}개`);
    console.log(`  활성: ${active}개`);
    console.log(`  총: ${companies.length}개\n`);

  } catch (error) {
    console.error('❌ 에러:', error.message);
    console.error('상세:', error);
  } finally {
    await sequelize.close();
  }
}

testCompaniesAPI();
