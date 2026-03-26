'use strict';

/**
 * 2026-03-24 이전 등록된 하드코딩/테스트 사용자 삭제
 *
 * 보존 대상 (삭제하지 않음):
 * - admin (시스템 관리자 — 개발/운영 필수)
 * - developer (금형개발 — 개발/운영 필수)
 * - 2026-03-24 이후 등록된 사내 사용자 51명
 * - 2026-03-26 이후 등록된 금형제조업체 16개사 계정
 *
 * 삭제 대상:
 * - 2025-12-13 등록된 구 테스트 관리자 계정 (102012, 102074, 102075, 103153 등)
 * - hq_manager, maker1, plant1 등 데모 계정
 * - MKR/PLT 업체에 연결된 테스트 사용자
 */

// 삭제하지 않을 계정 (운영 필수)
const KEEP_USERNAMES = ['admin', 'developer'];

module.exports = {
  async up(queryInterface) {
    const { sequelize } = queryInterface;

    const keepList = KEEP_USERNAMES.map(u => `'${u}'`).join(',');

    // 1) 삭제 대상 확인 (2026-03-24 이전 + 보존 목록 제외)
    const [targets] = await sequelize.query(`
      SELECT id, username, name, user_type, created_at
      FROM users
      WHERE created_at < '2026-03-24'
        AND username NOT IN (${keepList})
      ORDER BY created_at
    `);

    if (targets.length === 0) {
      console.log('ℹ️ 삭제할 구 테스트 사용자 없음');
      return;
    }

    console.log(`🔍 삭제 대상 ${targets.length}명:`, targets.map(t => `${t.username}(${t.name})`).join(', '));

    const targetIds = targets.map(t => t.id);
    const idList = targetIds.join(',');

    // 2) FK 참조 해제 — 각 테이블에서 user ID 참조 NULL 처리
    const fkUpdates = [
      `UPDATE notifications SET user_id = NULL WHERE user_id IN (${idList})`,
      `UPDATE mold_photos SET uploaded_by = NULL WHERE uploaded_by IN (${idList})`,
      `UPDATE inspection_photos SET uploaded_by = NULL WHERE uploaded_by IN (${idList})`,
      `UPDATE daily_check_items SET confirmed_by = NULL WHERE confirmed_by IN (${idList})`,
      `UPDATE alerts SET created_by = NULL WHERE created_by IN (${idList})`,
      `UPDATE mold_location_logs SET scanned_by_id = NULL WHERE scanned_by_id IN (${idList})`,
      `UPDATE approvals SET requester_id = NULL WHERE requester_id IN (${idList})`,
      `UPDATE approvals SET approver_id = NULL WHERE approver_id IN (${idList})`,
    ];

    for (const sql of fkUpdates) {
      await sequelize.query(sql).catch(() => {});
    }

    // 3) 사용자 삭제
    const [result] = await sequelize.query(`
      DELETE FROM users
      WHERE created_at < '2026-03-24'
        AND username NOT IN (${keepList})
      RETURNING id, username, name
    `);

    console.log(`🗑️ 구 테스트 사용자 ${result.length}명 삭제 완료`);
  },

  async down() {
    // 복원 불필요 (테스트 데이터)
  }
};
