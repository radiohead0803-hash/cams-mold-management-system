'use strict';

/**
 * 2026-03-24 이전 등록된 하드코딩/테스트 사용자 삭제
 * - FK 제약조건을 트랜잭션 내에서 일시 비활성화 후 삭제
 *
 * 보존: admin, developer, hq_manager, maker1, plant1
 * 삭제: 그 외 created_at < 2026-03-24 인 모든 사용자
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

    // 트랜잭션 내에서 FK 비활성화 → 참조 NULL 처리 → 삭제 → FK 복원
    const t = await sequelize.transaction();
    try {
      // FK 트리거 일시 비활성화 (세션 내에서만)
      await sequelize.query('SET session_replication_role = replica;', { transaction: t });

      // 모든 FK 참조 컬럼 NULL 처리 (주요 테이블)
      const tables = [
        ['notifications', 'user_id'],
        ['mold_photos', 'uploaded_by'],
        ['inspection_photos', 'uploaded_by'],
        ['daily_check_items', 'confirmed_by'],
        ['alerts', 'created_by'],
        ['mold_location_logs', 'scanned_by_id'],
        ['approvals', 'requester_id'],
        ['approvals', 'approver_id'],
        ['mold_specifications', 'created_by'],
        ['mold_specifications', 'updated_by'],
        ['repair_step_approvals', 'approver_id'],
        ['repair_requests', 'requested_by'],
        ['repair_requests', 'approved_by'],
        ['transfer_requests', 'requested_by'],
        ['transfer_requests', 'approved_by'],
        ['transfer_requests', 'received_by'],
        ['scrapping_requests', 'requested_by'],
        ['scrapping_requests', 'first_approved_by'],
        ['scrapping_requests', 'second_approved_by'],
        ['checklist_instances', 'checked_by'],
        ['checklist_instances', 'approved_by'],
        ['daily_checks', 'inspector_id'],
        ['periodic_inspections', 'inspector_id'],
        ['mold_events', 'actor_id'],
        ['maintenance_records', 'performed_by'],
        ['shot_records', 'recorded_by'],
        ['injection_condition_history', 'changed_by'],
        ['mold_development_plans', 'created_by'],
        ['pre_production_checklist_results', 'inspector_id'],
        ['qr_sessions', 'user_id'],
        ['drafts', 'user_id'],
      ];

      for (const [table, col] of tables) {
        await sequelize.query(
          `UPDATE "${table}" SET "${col}" = NULL WHERE "${col}" IN (${idList})`,
          { transaction: t }
        ).catch(() => {});
      }

      // 사용자 삭제
      const [result] = await sequelize.query(
        `DELETE FROM users WHERE created_at < '2026-03-24' AND username NOT IN (${keepList}) RETURNING id`,
        { transaction: t }
      );

      // FK 트리거 복원
      await sequelize.query('SET session_replication_role = DEFAULT;', { transaction: t });

      await t.commit();
      console.log(`🗑️ 구 테스트 사용자 ${result.length}명 삭제 완료`);
    } catch (error) {
      await t.rollback();
      console.error('❌ 사용자 삭제 실패:', error.message);
      throw error;
    }
  },

  async down() {}
};
