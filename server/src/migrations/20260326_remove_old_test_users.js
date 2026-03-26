'use strict';

/**
 * 2026-03-24 이전 등록된 하드코딩/테스트 사용자 삭제
 * - 동적 FK 조회 + 개별 트랜잭션으로 NULL/DELETE 처리
 */

const KEEP_USERNAMES = ['admin', 'developer', 'hq_manager', 'maker1', 'plant1'];

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    const keepList = KEEP_USERNAMES.map(u => `'${u}'`).join(',');

    const [targets] = await sequelize.query(`
      SELECT id FROM users
      WHERE created_at < '2026-03-24' AND username NOT IN (${keepList})
    `);

    if (targets.length === 0) {
      console.log('ℹ️ 삭제할 구 테스트 사용자 없음');
      return;
    }

    console.log(`🔍 삭제 대상 ${targets.length}명`);
    const idList = targets.map(t => t.id).join(',');

    // 동적 FK 조회
    let fkRefs = [];
    try {
      const [rows] = await sequelize.query(`
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON tc.constraint_name = ccu.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND ccu.table_name = 'users' AND ccu.column_name = 'id'
      `);
      fkRefs = rows;
    } catch (e) {
      console.warn('⚠️ FK 조회 실패:', e.message);
    }

    console.log(`📋 users FK 참조 ${fkRefs.length}개 발견`);

    // 각 FK 참조를 개별적으로 처리 (에러가 다른 쿼리에 영향 안 주도록)
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
        // NULL 불가 → DELETE 시도
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

    // 최종 삭제
    const t3 = await sequelize.transaction();
    try {
      const [result] = await sequelize.query(
        `DELETE FROM users WHERE created_at < '2026-03-24' AND username NOT IN (${keepList}) RETURNING id`,
        { transaction: t3 }
      );
      await t3.commit();
      console.log(`🗑️ 구 테스트 사용자 ${result.length}명 삭제 완료`);
    } catch (error) {
      await t3.rollback();
      console.error('❌ 사용자 삭제 최종 실패:', error.message);
    }
  },

  async down() {}
};
