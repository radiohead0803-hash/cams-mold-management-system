'use strict';

/**
 * MKR-xxx, PLT-xxx 테스트 업체 전체 삭제
 * - 동적 FK 조회 + 개별 트랜잭션으로 처리
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
    console.log(`🔍 삭제 대상 업체 ${targets.length}개`);

    let fkRefs = [];
    try {
      const [rows] = await sequelize.query(`
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'companies' AND ccu.column_name = 'id'
      `);
      fkRefs = rows;
    } catch (e) {
      console.warn('⚠️ FK 조회 실패:', e.message);
    }

    for (const ref of fkRefs) {
      const t1 = await sequelize.transaction();
      try {
        await sequelize.query(
          `UPDATE "${ref.table_name}" SET "${ref.column_name}" = NULL WHERE "${ref.column_name}" IN (${idList})`,
          { transaction: t1 }
        );
        await t1.commit();
      } catch (e) {
        await t1.rollback();
        const t2 = await sequelize.transaction();
        try {
          await sequelize.query(
            `DELETE FROM "${ref.table_name}" WHERE "${ref.column_name}" IN (${idList})`,
            { transaction: t2 }
          );
          await t2.commit();
        } catch (e2) {
          await t2.rollback();
          console.warn(`  ⚠️ ${ref.table_name}.${ref.column_name} 처리 실패`);
        }
      }
    }

    const t3 = await sequelize.transaction();
    try {
      const [result] = await sequelize.query(
        `DELETE FROM companies WHERE ${pattern} RETURNING company_code, company_name`,
        { transaction: t3 }
      );
      await t3.commit();
      console.log(`🗑️ 테스트 업체 ${result.length}개 삭제 완료`);
    } catch (error) {
      await t3.rollback();
      console.error('❌ 테스트 업체 삭제 최종 실패:', error.message);
    }
  },

  async down() {}
};
