/**
 * 금형 이벤트 모델
 * 금형 Life-cycle 이력 자동 기록
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const MoldEvent = sequelize.define('MoldEvent', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 금형 ID
    mold_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // 금형 코드 (검색 편의)
    mold_code: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // 이벤트 유형
    event_type: {
      type: DataTypes.ENUM(
        'created',           // 금형 등록
        'status_changed',    // 상태 변경
        'inspection_daily',  // 일상점검
        'inspection_periodic', // 정기점검
        'inspection_cleaning', // 세척
        'inspection_greasing', // 습합
        'repair_requested',  // 수리 요청
        'repair_started',    // 수리 시작
        'repair_completed',  // 수리 완료
        'transfer_requested', // 이관 요청
        'transfer_approved', // 이관 승인
        'transfer_completed', // 이관 완료
        'scrapping_requested', // 폐기 요청
        'scrapping_approved', // 폐기 승인
        'scrapping_completed', // 폐기 완료
        'shot_count_updated', // 타수 업데이트
        'location_changed',  // 위치 변경
        'specification_updated', // 사양 변경
        'document_uploaded', // 문서 업로드
        'approval_requested', // 승인 요청
        'approval_completed', // 승인 완료
        'note_added'         // 메모 추가
      ),
      allowNull: false
    },
    // 참조 ID (관련 테이블의 ID)
    reference_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // 참조 테이블명
    reference_table: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // 이벤트 제목
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    // 이벤트 설명
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 이전 값 (상태 변경 등)
    previous_value: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    // 새 값
    new_value: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    // 수행자 ID
    actor_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // 수행자 이름
    actor_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // 수행자 소속
    actor_company: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    // 추가 메타데이터
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true
    }
  }, {
    tableName: 'mold_events',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['mold_id'] },
      { fields: ['mold_code'] },
      { fields: ['event_type'] },
      { fields: ['created_at'] },
      { fields: ['actor_id'] }
    ]
  });

  return MoldEvent;
};
