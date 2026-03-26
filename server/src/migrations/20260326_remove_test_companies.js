'use strict';

/**
 * 하드코딩된 테스트/샘플 업체 데이터 전체 삭제
 * - MKR-xxx (테스트 제작처 전체)
 * - PLT-xxx (테스트 생산처 전체)
 * - 연결된 users, molds FK 해제 후 삭제
 *
 * ⚠️ 실제 업체 코드(E0018, C5389 등)는 삭제하지 않음
 */

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    // MKR-xxx, PLT-xxx 패턴 전체 삭제 (LIKE 패턴 매칭)
    const pattern = `company_code LIKE 'MKR-%' OR company_code LIKE 'PLT-%'`;

    // 1) 테스트 업체에 연결된 사용자의 company_id 해제 (FK 에러 방지)
    await sequelize.query(`
      UPDATE users SET company_id = NULL, company_name = NULL, updated_at = NOW()
      WHERE company_id IN (SELECT id FROM companies WHERE ${pattern})
    `).catch(() => {});

    // 2) 테스트 업체와 연결된 금형의 maker/plant company_id 해제
    await sequelize.query(`
      UPDATE molds SET maker_company_id = NULL, updated_at = NOW()
      WHERE maker_company_id IN (SELECT id FROM companies WHERE ${pattern})
    `).catch(() => {});

    await sequelize.query(`
      UPDATE molds SET plant_company_id = NULL, updated_at = NOW()
      WHERE plant_company_id IN (SELECT id FROM companies WHERE ${pattern})
    `).catch(() => {});

    // 3) 관련 company_equipments 삭제
    await sequelize.query(`
      DELETE FROM company_equipments
      WHERE company_id IN (SELECT id FROM companies WHERE ${pattern})
    `).catch(() => {});

    // 4) 관련 company_contacts 삭제
    await sequelize.query(`
      DELETE FROM company_contacts
      WHERE company_id IN (SELECT id FROM companies WHERE ${pattern})
    `).catch(() => {});

    // 5) 관련 company_certifications 삭제
    await sequelize.query(`
      DELETE FROM company_certifications
      WHERE company_id IN (SELECT id FROM companies WHERE ${pattern})
    `).catch(() => {});

    // 6) 테스트 업체 삭제
    const [result] = await sequelize.query(`
      DELETE FROM companies WHERE ${pattern} RETURNING company_code, company_name
    `);

    if (result.length > 0) {
      console.log(`🗑️ 테스트 업체 ${result.length}개 삭제:`, result.map(r => `${r.company_code}(${r.company_name})`).join(', '));
    } else {
      console.log('ℹ️ 삭제할 테스트 업체 없음 (이미 정리됨)');
    }
  },

  async down() {
    // 복원 불필요 (테스트 데이터)
  }
};
