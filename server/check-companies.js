const { Sequelize } = require('sequelize');
const config = require('./src/config/database');

const env = process.env.NODE_ENV || 'production';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, {
  ...dbConfig,
  logging: false
});

async function checkCompanies() {
  try {
    await sequelize.authenticate();
    
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
        is_active
      FROM companies 
      ORDER BY company_type, company_code;
    `);

    console.log('\n📊 Companies in Database:\n');
    console.log('┌─────┬─────────────┬──────────────────────┬──────────┬───────────────┬─────────┬────────┐');
    console.log('│ ID  │ Code        │ Name                 │ Type     │ Manager       │ Rating  │ Molds  │');
    console.log('├─────┼─────────────┼──────────────────────┼──────────┼───────────────┼─────────┼────────┤');
    
    companies.forEach(c => {
      const type = c.company_type === 'maker' ? '🏭 제작처' : '🏢 생산처';
      const rating = c.rating ? `⭐ ${parseFloat(c.rating).toFixed(1)}` : '-';
      console.log(
        `│ ${String(c.id).padEnd(3)} │ ${c.company_code.padEnd(11)} │ ${c.company_name.padEnd(20)} │ ${type.padEnd(8)} │ ${(c.manager_name || '-').padEnd(13)} │ ${rating.padEnd(7)} │ ${String(c.total_molds || 0).padEnd(6)} │`
      );
    });
    
    console.log('└─────┴─────────────┴──────────────────────┴──────────┴───────────────┴─────────┴────────┘');
    
    const [stats] = await sequelize.query(`
      SELECT 
        company_type,
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM companies
      GROUP BY company_type;
    `);
    
    console.log('\n📈 Statistics:\n');
    stats.forEach(s => {
      const type = s.company_type === 'maker' ? '🏭 제작처' : '🏢 생산처';
      const avgRating = s.avg_rating ? parseFloat(s.avg_rating).toFixed(2) : 'N/A';
      console.log(`${type}: ${s.count}개 (평균 평가: ${avgRating})`);
    });
    
    const [total] = await sequelize.query(`SELECT COUNT(*) as total FROM companies;`);
    console.log(`\n✅ Total: ${total[0].total}개 업체 등록됨\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkCompanies();
