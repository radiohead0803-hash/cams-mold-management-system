/**
 * 통합 승인 모델
 * 모든 승인 요청을 단일 테이블에서 관리
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Approval = sequelize.define('Approval', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 승인 유형
    approval_type: {
      type: DataTypes.ENUM(
        'checklist_revision',      // 체크리스트 개정 승인
        'document_publish',        // 표준문서 배포 승인
        'transfer_approval',       // 금형 이관 승인
        'scrapping_approval',      // 금형 폐기 승인
        'repair_liability',        // 수리 귀책 협의
        'inspection_approval'      // 점검 승인
      ),
      allowNull: false
    },
    // 대상 ID (각 유형별 원본 테이블의 ID)
    target_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // 대상 테이블명 (참조용)
    target_table: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    // 승인 상태
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'cancelled'),
      defaultValue: 'pending'
    },
    // 요청 제목
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    // 요청 설명
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 요청자 ID
    requester_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // 요청자 이름 (조회 편의)
    requester_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // 요청자 소속
    requester_company: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // 요청일시
    requested_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    // 승인자 ID
    approver_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // 승인자 이름
    approver_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // 승인/반려 일시
    processed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // 승인/반려 사유
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 우선순위
    priority: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'critical'),
      defaultValue: 'normal'
    },
    // SLA 마감일 (승인 기한)
    due_date: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // 관련 금형 코드 (검색용)
    mold_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // 추가 메타데이터 (JSON)
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'approvals',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['approval_type'] },
      { fields: ['status'] },
      { fields: ['requester_id'] },
      { fields: ['approver_id'] },
      { fields: ['requested_at'] },
      { fields: ['due_date'] },
      { fields: ['mold_code'] }
    ]
  });

  return Approval;
};
