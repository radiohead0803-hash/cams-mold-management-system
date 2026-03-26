'use strict';

/**
 * MKR-xxx, PLT-xxx 테스트 업체 전체 삭제
 * - FK 트리거 일시 비활성화 후 삭제
 */

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    const pattern = `company_code LIKE 'MKR-%' OR company_code LIKE 'PLT-%'`;

    const [targets] = await sequelize.query(`SELECT id, company_code, company_name FROM companies WHERE ${pattern}`);
    if (targets.length === 0) {
      console.log('ℹ️ 삭제할 테스트 업체 없음');
      return;
    }

    const idList = targets.map(t => t.id).join(',');

    const t = await sequelize.transaction();
    try {
      await sequelize.query('SET session_replication_role = replica;', { transaction: t });

      // FK 참조 NULL 처리
      const refs = [
        ['users', 'company_id'],
        ['molds', 'maker_company_id'],
        ['molds', 'plant_company_id'],
        ['mold_specifications', 'maker_company_id'],
        ['mold_specifications', 'plant_company_id'],
      ];
      for (const [table, col] of refs) {
        await sequelize.query(
          `UPDATE "${table}" SET "${col}" = NULL WHERE "${col}" IN (${idList})`,
          { transaction: t }
        ).catch(() => {});
      }

      // 관련 데이터 삭제
      for (const table of ['company_equipments', 'company_contacts', 'company_certifications']) {
        await sequelize.query(
          `DELETE FROM "${table}" WHERE company_id IN (${idList})`,
          { transaction: t }
        ).catch(() => {});
      }

      // 업체 삭제
      const [result] = await sequelize.query(
        `DELETE FROM companies WHERE ${pattern} RETURNING company_code, company_name`,
        { transaction: t }
      );

      await sequelize.query('SET session_replication_role = DEFAULT;', { transaction: t });
      await t.commit();

      console.log(`🗑️ 테스트 업체 ${result.length}개 삭제:`, result.map(r => `${r.company_code}(${r.company_name})`).join(', '));
    } catch (error) {
      await t.rollback();
      console.error('❌ 테스트 업체 삭제 실패:', error.message);
      throw error;
    }
  },

  async down() {}
};
