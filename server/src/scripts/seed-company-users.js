/**
 * 업체별 사용자 계정 생성 및 금형 연동 시드 스크립트
 * 
 * 1. 모든 companies에 대해 사용자 계정 생성 (아이디=업체코드, 비번=1234)
 * 2. 기존 maker1/plant1 유저에 company_id 연결
 * 3. 금형(molds, mold_specifications)에 maker_company_id, plant_company_id 연동
 */
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const DB_URL = process.env.DATABASE_URL || 'postgresql://postgres:YcdaEiRCsgzeWWgAcrfzmkQuXZDYShMd@switchyard.proxy.rlwy.net:34950/railway';
const sequelize = new Sequelize(DB_URL, { logging: false });

async function run() {
  try {
    console.log('🔄 업체별 사용자 계정 생성 시작...\n');

    // 1. 모든 companies 조회
    const [companies] = await sequelize.query(
      'SELECT id, company_code, company_name, company_type FROM companies ORDER BY id'
    );
    console.log(`📋 총 ${companies.length}개 업체 확인\n`);

    // 2. 비밀번호 해시 생성 (1234)
    const passwordHash = await bcrypt.hash('1234', 10);

    // 3. 각 업체별 사용자 계정 생성
    let created = 0;
    let skipped = 0;

    for (const company of companies) {
      const username = company.company_code.toLowerCase();
      
      // 이미 존재하는지 확인
      const [existing] = await sequelize.query(
        'SELECT id FROM users WHERE username = :username',
        { replacements: { username }, type: Sequelize.QueryTypes.SELECT }
      );

      if (existing) {
        console.log(`  ⏭️  ${username} (${company.company_name}) - 이미 존재, 건너뜀`);
        // company_id 업데이트만 수행
        await sequelize.query(
          `UPDATE users SET company_id = :companyId, company_name = :companyName, company_type = :companyType WHERE username = :username`,
          { replacements: { companyId: company.id, companyName: company.company_name, companyType: company.company_type, username } }
        );
        skipped++;
        continue;
      }

      const userType = company.company_type; // 'maker' or 'plant'
      const roleLabel = userType === 'maker' ? '제작처' : '생산처';
      const name = `${company.company_name} 담당자`;

      await sequelize.query(
        `INSERT INTO users (username, password_hash, name, email, phone, user_type, company_id, company_name, company_type, is_active, failed_login_attempts, created_at, updated_at)
         VALUES (:username, :passwordHash, :name, :email, :phone, :userType, :companyId, :companyName, :companyType, true, 0, NOW(), NOW())`,
        {
          replacements: {
            username,
            passwordHash,
            name,
            email: `${username}@cams.com`,
            phone: null,
            userType,
            companyId: company.id,
            companyName: company.company_name,
            companyType: company.company_type
          }
        }
      );
      console.log(`  ✅ ${username} / 1234 → ${company.company_name} (${roleLabel})`);
      created++;
    }

    console.log(`\n📊 계정 생성 결과: 생성 ${created}개, 건너뜀 ${skipped}개\n`);

    // 4. 기존 maker1/plant1 유저에 company_id 연결
    console.log('🔗 기존 유저 company_id 연결...');
    
    // maker1 → MKR-001 (id=1)
    await sequelize.query(
      `UPDATE users SET company_id = 1, company_name = '지금강(장성)', company_type = 'maker' WHERE username = 'maker1' AND (company_id IS NULL OR company_id = 0)`
    );
    console.log('  ✅ maker1 → 지금강(장성) (company_id=1)');

    // plant1 → PLT-001 (id=4)
    await sequelize.query(
      `UPDATE users SET company_id = 4, company_name = '현대자동차 울산공장', company_type = 'plant' WHERE username = 'plant1' AND (company_id IS NULL OR company_id = 0)`
    );
    console.log('  ✅ plant1 → 현대자동차 울산공장 (company_id=4)');

    // 5. 금형 데이터 연동 - maker_company_id / plant_company_id가 null인 금형에 분산 배정
    console.log('\n🔧 금형 데이터 업체 연동...');

    // maker companies
    const makerCompanies = companies.filter(c => c.company_type === 'maker');
    const plantCompanies = companies.filter(c => c.company_type === 'plant');

    // molds 테이블 - maker_company_id가 null인 것 업데이트
    const [nullMakerMolds] = await sequelize.query(
      'SELECT id, mold_code FROM molds WHERE maker_company_id IS NULL ORDER BY id'
    );
    
    if (nullMakerMolds.length > 0) {
      console.log(`  📦 molds 테이블: maker_company_id NULL인 금형 ${nullMakerMolds.length}개 연동`);
      for (let i = 0; i < nullMakerMolds.length; i++) {
        const maker = makerCompanies[i % makerCompanies.length];
        const plant = plantCompanies[i % plantCompanies.length];
        await sequelize.query(
          `UPDATE molds SET maker_company_id = :makerId, plant_company_id = :plantId WHERE id = :moldId`,
          { replacements: { makerId: maker.id, plantId: plant.id, moldId: nullMakerMolds[i].id } }
        );
      }
      console.log(`  ✅ ${nullMakerMolds.length}개 금형에 제작처/생산처 배정 완료`);
    }

    // mold_specifications 테이블
    const [nullMakerSpecs] = await sequelize.query(
      'SELECT id, part_number FROM mold_specifications WHERE maker_company_id IS NULL ORDER BY id'
    );
    
    if (nullMakerSpecs.length > 0) {
      console.log(`  📦 mold_specifications 테이블: maker_company_id NULL인 사양 ${nullMakerSpecs.length}개 연동`);
      for (let i = 0; i < nullMakerSpecs.length; i++) {
        const maker = makerCompanies[i % makerCompanies.length];
        const plant = plantCompanies[i % plantCompanies.length];
        await sequelize.query(
          `UPDATE mold_specifications SET maker_company_id = :makerId, plant_company_id = :plantId WHERE id = :specId`,
          { replacements: { makerId: maker.id, plantId: plant.id, specId: nullMakerSpecs[i].id } }
        );
      }
      console.log(`  ✅ ${nullMakerSpecs.length}개 사양에 제작처/생산처 배정 완료`);
    }

    // 6. 최종 확인
    console.log('\n📋 최종 계정 목록:');
    const [allUsers] = await sequelize.query(
      "SELECT username, user_type, company_id, company_name FROM users WHERE user_type IN ('maker', 'plant') ORDER BY user_type, username"
    );
    allUsers.forEach(u => {
      console.log(`  ${u.username.padEnd(12)} | ${u.user_type.padEnd(6)} | company_id=${String(u.company_id).padEnd(4)} | ${u.company_name || '-'}`);
    });

    console.log('\n✅ 시드 작업 완료!');
    console.log('\n📌 로그인 정보:');
    companies.forEach(c => {
      console.log(`  아이디: ${c.company_code.toLowerCase()}  비밀번호: 1234  (${c.company_name} - ${c.company_type === 'maker' ? '제작처' : '생산처'})`);
    });

  } catch (error) {
    console.error('❌ 에러:', error.message);
    console.error(error.stack);
  } finally {
    await sequelize.close();
  }
}

run();
