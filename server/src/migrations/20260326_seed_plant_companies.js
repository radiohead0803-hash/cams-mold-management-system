'use strict';
const bcrypt = require('bcryptjs');

// ═══════════════════════════════════════════════════════
// 생산처(plant) 전용 업체 — 42개사
// ═══════════════════════════════════════════════════════
const PLANT_ONLY = [
  { code: 'C7124', name: '에이티에스' },
  { code: 'C0502', name: '아성프라텍' },
  { code: 'C0665', name: '신성화학' },
  { code: 'C0386', name: '성우하이텍' },
  { code: 'C2533', name: '성신스프레이' },
  { code: 'C1409', name: '라도' },
  { code: 'C0820', name: '두원공조' },
  { code: 'C2639', name: '동남지엠티' },
  { code: 'C0876', name: '대정' },
  { code: 'C0573', name: '대의' },
  { code: 'C0911', name: 'KCC' },
  { code: 'C0599', name: '덕성인터스트리' },
  { code: 'C0950', name: '니프코코리아 아산공장' },
  { code: 'C5148', name: '노루오토코팅' },
  { code: 'C5511', name: '남도금형제2공장' },
  { code: 'C0802', name: '광성기업' },
  { code: 'C2456', name: 'G금강' },
  { code: 'C0828', name: '호원' },
  { code: 'C3350', name: '한화미의령공장' },
  { code: 'C0945', name: '한국큐빅' },
  { code: 'C0884', name: '카라' },
  { code: 'C2560', name: '청운하이텍' },
  { code: 'C2577', name: '진합' },
  { code: 'C2301', name: '유림테크 지점' },
  { code: 'C0449', name: '부영운수' },
  { code: 'C0139', name: '현대이피 주식회사' },
  { code: 'C0830', name: '한국ITW' },
  { code: 'C4474', name: '케이엔케이코팅스광주' },
  { code: 'C2881', name: '카본텍' },
  { code: 'C2149', name: '와이엠' },
  { code: 'C4189', name: '모아에스엔피' },
  { code: 'C0714', name: '장원금속' },
  { code: 'C7428', name: '유창지엠티' },
  { code: 'C1996', name: '유니온산업' },
  { code: 'C0919', name: '아이아' },
  { code: 'C0707', name: '서라벌산업' },
  { code: 'C1995', name: '부성아이엔지' },
  { code: 'C4123', name: '디알씨코리아' },
];

// ═══════════════════════════════════════════════════════
// 제작+생산 겸업 업체 — 4개사 (이미 제작처로 등록됨)
// 기존 maker 계정: 코드M / 신규 plant 계정: 코드P
// ═══════════════════════════════════════════════════════
const DUAL_COMPANIES = [
  { code: 'E0249', name: '에스에스몰드' },
  { code: 'C1531', name: '제일산기' },
  { code: 'C1853', name: '아이앤테크' },
  { code: 'C0809', name: '동신산업(평택)' },
];

module.exports = {
  async up(queryInterface) {
    const results = { plant: 0, dual_maker: 0, dual_plant: 0 };

    // ── 1) 생산처 전용 업체: companies + users 등록 ──
    for (const c of PLANT_ONLY) {
      const pwHash = await bcrypt.hash(c.code, 10);

      // companies UPSERT
      await queryInterface.sequelize.query(`
        INSERT INTO companies (company_code, company_name, company_type, is_active, created_at, updated_at)
        VALUES (:code, :name, 'plant', true, NOW(), NOW())
        ON CONFLICT (company_code) DO UPDATE SET
          company_name = EXCLUDED.company_name, company_type = 'plant',
          is_active = true, updated_at = NOW()
      `, { replacements: { code: c.code, name: c.name } });

      // 생산처 user: 아이디 = 코드
      await queryInterface.sequelize.query(`
        INSERT INTO users (username, password_hash, name, user_type, company_type, company_name, is_active, created_at, updated_at)
        VALUES (:username, :pwHash, :name, 'plant', 'plant', :companyName, true, NOW(), NOW())
        ON CONFLICT (username) DO UPDATE SET
          name = EXCLUDED.name, user_type = 'plant', company_type = 'plant',
          company_name = EXCLUDED.company_name, is_active = true, updated_at = NOW()
      `, { replacements: { username: c.code, pwHash, name: c.name + ' 담당자', companyName: c.name } });

      results.plant++;
    }

    // ── 2) 겸업 업체: 기존 maker 계정 → 코드M, 신규 plant 계정 → 코드P ──
    for (const c of DUAL_COMPANIES) {
      const makerUser = c.code + 'M';
      const plantUser = c.code + 'P';
      const makerPwHash = await bcrypt.hash(makerUser, 10);
      const plantPwHash = await bcrypt.hash(plantUser, 10);

      // 기존 코드 계정을 코드M으로 이름 변경 (제작처)
      // 먼저 기존 코드 username이 있는지 확인
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE username = :code`, { replacements: { code: c.code } }
      );

      if (existing.length > 0) {
        // 기존 계정을 코드M으로 변경
        await queryInterface.sequelize.query(`
          UPDATE users SET username = :newUser, password_hash = :pwHash, updated_at = NOW()
          WHERE username = :oldUser
        `, { replacements: { newUser: makerUser, pwHash: makerPwHash, oldUser: c.code } });
        results.dual_maker++;
      } else {
        // 없으면 새로 생성
        await queryInterface.sequelize.query(`
          INSERT INTO users (username, password_hash, name, user_type, company_type, company_name, is_active, created_at, updated_at)
          VALUES (:username, :pwHash, :name, 'maker', 'maker', :companyName, true, NOW(), NOW())
          ON CONFLICT (username) DO UPDATE SET
            name = EXCLUDED.name, user_type = 'maker', company_type = 'maker',
            company_name = EXCLUDED.company_name, is_active = true, updated_at = NOW()
        `, { replacements: { username: makerUser, pwHash: makerPwHash, name: c.name + ' 제작', companyName: c.name } });
        results.dual_maker++;
      }

      // 생산처 계정 코드P 생성
      await queryInterface.sequelize.query(`
        INSERT INTO users (username, password_hash, name, user_type, company_type, company_name, is_active, created_at, updated_at)
        VALUES (:username, :pwHash, :name, 'plant', 'plant', :companyName, true, NOW(), NOW())
        ON CONFLICT (username) DO UPDATE SET
          name = EXCLUDED.name, user_type = 'plant', company_type = 'plant',
          company_name = EXCLUDED.company_name, is_active = true, updated_at = NOW()
      `, { replacements: { username: plantUser, pwHash: plantPwHash, name: c.name + ' 생산', companyName: c.name } });
      results.dual_plant++;
    }

    console.log(`✅ 생산처 시드 완료:`);
    console.log(`   - 생산처 전용: ${results.plant}개사`);
    console.log(`   - 겸업 제작처(M): ${results.dual_maker}개사`);
    console.log(`   - 겸업 생산처(P): ${results.dual_plant}개사`);
    console.log(`   - 총 사용자: ${results.plant + results.dual_maker + results.dual_plant}명`);
  },

  async down(queryInterface) {
    const codes = PLANT_ONLY.map(c => c.code);
    const dualM = DUAL_COMPANIES.map(c => c.code + 'M');
    const dualP = DUAL_COMPANIES.map(c => c.code + 'P');
    const allUsernames = [...codes, ...dualM, ...dualP];

    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE username IN (:usernames)`,
      { replacements: { usernames: allUsernames } }
    );
    await queryInterface.sequelize.query(
      `DELETE FROM companies WHERE company_code IN (:codes)`,
      { replacements: { codes } }
    );
  }
};
