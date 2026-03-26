'use strict';

/**
 * 테스트용 업체 데이터 삭제
 * - MKR-001 ~ MKR-005 (테스트 제작처)
 * - PLT-001 ~ PLT-003 (테스트 생산처)
 * - 연결된 users도 함께 정리 (company_id 기반)
 *
 * ⚠️ 실제 업체 코드(E0018, C5389 등)는 삭제하지 않음
 */

const TEST_CODES = [
  'MKR-001', 'MKR-002', 'MKR-003', 'MKR-004', 'MKR-005',
  'PLT-001', 'PLT-002', 'PLT-003', 'PLT-004', 'PLT-005', 'PLT-006'
];

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    const codeList = TEST_CODES.map(c => `'${c}'`).join(',');

    // 1) 테스트 업체에 연결된 사용자의 company_id 해제 (FK 에러 방지)
    await sequelize.query(`
      UPDATE users SET company_id = NULL, company_name = NULL, updated_at = NOW()
      WHERE company_id IN (
        SELECT id FROM companies WHERE company_code IN (${codeList})
      )
    `).catch(() => {});

    // 2) 테스트 업체와 연결된 금형의 maker_company_id / plant_company_id 해제
    await sequelize.query(`
      UPDATE molds SET maker_company_id = NULL, updated_at = NOW()
      WHERE maker_company_id IN (
        SELECT id FROM companies WHERE company_code IN (${codeList})
      )
    `).catch(() => {});

    await sequelize.query(`
      UPDATE molds SET plant_company_id = NULL, updated_at = NOW()
      WHERE plant_company_id IN (
        SELECT id FROM companies WHERE company_code IN (${codeList})
      )
    `).catch(() => {});

    // 3) 테스트 업체 삭제
    const [result] = await sequelize.query(`
      DELETE FROM companies WHERE company_code IN (${codeList}) RETURNING company_code, company_name
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
