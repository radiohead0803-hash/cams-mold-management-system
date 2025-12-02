/**
 * 생산처 대시보드 컨트롤러
 * 최소 스텁 API - 에러 방지용
 */

/**
 * 최근 활동 목록 조회
 * GET /api/v1/plant/dashboard/recent-activities?limit=10
 * 
 * TODO: 나중에 점검/수리/이관 이력에서 실제 데이터 조회
 */
async function getRecentActivities(req, res) {
  try {
    const { limit = 10 } = req.query;

    // TODO: 실제 DB에서 조회
    // - 점검 이력 (checklist_instances)
    // - 수리 요청 (repair_requests)
    // - 금형 이관 (mold_transfers)
    // - 위치 변경 (mold_location_logs)
    
    // 임시: 항상 빈 배열 반환
    return res.json({
      success: true,
      data: []
    });

  } catch (err) {
    console.error('[getRecentActivities] error:', err);
    // 에러 발생 시에도 빈 배열 반환 (500 방지)
    return res.json({
      success: true,
      data: []
    });
  }
}

/**
 * 대시보드 통계 조회
 * GET /api/v1/plant/dashboard/stats
 * 
 * TODO: 나중에 실제 통계 계산
 */
async function getDashboardStats(req, res) {
  try {
    // TODO: 실제 통계 계산
    // - 총 금형 수
    // - 점검 완료/미완료
    // - NG 발생 건수
    // - 수리 중인 금형
    
    // 임시: 기본 통계 반환
    return res.json({
      success: true,
      data: {
        totalMolds: 0,
        inspectionCompleted: 0,
        inspectionPending: 0,
        ngCount: 0,
        repairingCount: 0
      }
    });

  } catch (err) {
    console.error('[getDashboardStats] error:', err);
    return res.json({
      success: true,
      data: {
        totalMolds: 0,
        inspectionCompleted: 0,
        inspectionPending: 0,
        ngCount: 0,
        repairingCount: 0
      }
    });
  }
}

module.exports = {
  getRecentActivities,
  getDashboardStats
};
