'use strict';

/**
 * MKR-xxx, PLT-xxx 테스트 업체 전체 삭제
 * - 모든 FK 참조를 동적으로 찾아서 NULL/DELETE 처리
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

    // 동적으로 companies 테이블을 참조하는 모든 FK 컬럼 조회
    const [fkRefs] = await sequelize.query(`
      SELECT tc.table_name, kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'companies' AND ccu.column_name = 'id'
    `);

    console.log(`📋 companies FK 참조 ${fkRefs.length}개 발견`);

    for (const ref of fkRefs) {
      try {
        await sequelize.query(`UPDATE "${ref.table_name}" SET "${ref.column_name}" = NULL WHERE "${ref.column_name}" IN (${idList})`);
      } catch (e) {
        try {
          await sequelize.query(`DELETE FROM "${ref.table_name}" WHERE "${ref.column_name}" IN (${idList})`);
        } catch (e2) {
          console.warn(`  ⚠️ ${ref.table_name}.${ref.column_name}: ${e2.message?.substring(0, 80)}`);
        }
      }
    }

    const [result] = await sequelize.query(`DELETE FROM companies WHERE ${pattern} RETURNING company_code, company_name`);
    console.log(`🗑️ 테스트 업체 ${result.length}개 삭제:`, result.map(r => `${r.company_code}(${r.company_name})`).join(', '));
  },

  async down() {}
};
