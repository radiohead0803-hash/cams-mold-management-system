/**
 * companies 테이블의 company_type 제약조건 확인
 */
const { sequelize } = require('../src/models');

async function checkCompanyTypes() {
  try {
    // 현재 등록된 company_type 값 확인
    const [types] = await sequelize.query(`
      SELECT DISTINCT company_type FROM companies
    `);
    console.log('현재 등록된 company_type 값:', types.map(t => t.company_type));

    // CHECK 제약조건 확인
    const [constraints] = await sequelize.query(`
      SELECT pg_get_constraintdef(oid) as definition
      FROM pg_constraint 
      WHERE conname = 'companies_company_type_check'
    `);
    console.log('CHECK 제약조건:', constraints);

    // 현재 업체 목록
    const [companies] = await sequelize.query(`
      SELECT id, company_name, company_type FROM companies ORDER BY id
    `);
    console.log('\n현재 업체 목록:');
    companies.forEach(c => console.log(`  [${c.id}] ${c.company_name} - ${c.company_type}`));

  } catch (error) {
    console.error('오류:', error.message);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

checkCompanyTypes();
