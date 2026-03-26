'use strict';

/**
 * 2026-03-24 이전 등록된 하드코딩/테스트 사용자 삭제
 * - 모든 FK 참조를 동적으로 찾아서 NULL 처리 후 삭제
 */

const KEEP_USERNAMES = ['admin', 'developer', 'hq_manager', 'maker1', 'plant1'];

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;
    const keepList = KEEP_USERNAMES.map(u => `'${u}'`).join(',');

    // 삭제 대상 확인
    const [targets] = await sequelize.query(`
      SELECT id, username, name FROM users
      WHERE created_at < '2026-03-24' AND username NOT IN (${keepList})
    `);

    if (targets.length === 0) {
      console.log('ℹ️ 삭제할 구 테스트 사용자 없음');
      return;
    }

    console.log(`🔍 삭제 대상 ${targets.length}명`);
    const idList = targets.map(t => t.id).join(',');

    // 동적으로 users 테이블을 참조하는 모든 FK 컬럼 조회
    const [fkRefs] = await sequelize.query(`
      SELECT
        tc.table_name,
        kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON tc.constraint_name = ccu.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND ccu.table_name = 'users'
        AND ccu.column_name = 'id'
    `);

    console.log(`📋 users FK 참조 ${fkRefs.length}개 발견`);

    // 모든 FK 참조 컬럼 NULL 처리
    for (const ref of fkRefs) {
      try {
        await sequelize.query(
          `UPDATE "${ref.table_name}" SET "${ref.column_name}" = NULL WHERE "${ref.column_name}" IN (${idList})`
        );
      } catch (e) {
        // NULL 불가 컬럼이면 해당 레코드 삭제
        try {
          await sequelize.query(
            `DELETE FROM "${ref.table_name}" WHERE "${ref.column_name}" IN (${idList})`
          );
        } catch (e2) {
          console.warn(`  ⚠️ ${ref.table_name}.${ref.column_name}: ${e2.message?.substring(0, 80)}`);
        }
      }
    }

    // 사용자 삭제
    const [result] = await sequelize.query(`
      DELETE FROM users
      WHERE created_at < '2026-03-24' AND username NOT IN (${keepList})
      RETURNING id
    `);

    console.log(`🗑️ 구 테스트 사용자 ${result.length}명 삭제 완료`);
  },

  async down() {}
};
