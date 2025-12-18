/**
 * 금형 수리 후 출하단계 점검 체크리스트 모델
 * - 수리 완료 → 출하 전 필수 점검
 * - 제작처 1차 점검 → 본사 승인
 */
module.exports = (sequelize, DataTypes) => {
  const RepairShipmentChecklist = sequelize.define(
    'RepairShipmentChecklist',
    {
      // 체크리스트 번호 (RSC-YYYYMMDD-XXX)
      checklist_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '체크리스트 번호'
      },
      // 수리요청 연결
      repair_request_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '수리요청 ID'
      },
      // 금형 정보
      mold_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '금형 ID'
      },
      mold_spec_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: '금형사양 ID'
      },
      // 상태
      status: {
        type: DataTypes.STRING(30),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'draft | in_progress | pending_approval | approved | rejected | shipped'
      },
      // 제작처 정보
      maker_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: '제작처 ID'
      },
      maker_checker_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: '제작처 점검자 ID'
      },
      maker_checker_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '제작처 점검자명'
      },
      maker_check_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '제작처 점검일'
      },
      // 본사 승인 정보
      hq_approver_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: '본사 승인자 ID'
      },
      hq_approver_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '본사 승인자명'
      },
      hq_approval_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '본사 승인일'
      },
      hq_rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '반려 사유'
      },
      // GPS 위치
      gps_latitude: {
        type: DataTypes.DECIMAL(10, 8),
        allowNull: true,
        comment: 'GPS 위도'
      },
      gps_longitude: {
        type: DataTypes.DECIMAL(11, 8),
        allowNull: true,
        comment: 'GPS 경도'
      },
      gps_address: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: 'GPS 주소'
      },
      // 출하 정보
      shipment_destination: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '출하 목적지 (생산처/보관처)'
      },
      shipment_date: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '출하일'
      },
      // 시운전 정보
      trial_run_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '시운전 필요 여부'
      },
      trial_run_result: {
        type: DataTypes.STRING(30),
        allowNull: true,
        comment: 'pass | conditional_pass | fail'
      },
      trial_run_condition: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '조건부 PASS 시 조건'
      },
      // 점검 결과 요약
      total_items: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '총 점검 항목 수'
      },
      passed_items: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'PASS 항목 수'
      },
      failed_items: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'FAIL 항목 수'
      },
      na_items: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: 'N/A 항목 수'
      },
      // 비고
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '비고'
      },
      // 메타데이터
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: '추가 메타데이터'
      }
    },
    {
      tableName: 'repair_shipment_checklists',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['repair_request_id'] },
        { fields: ['mold_id'] },
        { fields: ['status'] },
        { fields: ['maker_id'] },
        { fields: ['hq_approver_id'] }
      ]
    }
  );

  RepairShipmentChecklist.associate = (models) => {
    // 수리요청과 연결
    if (models.RepairRequest) {
      RepairShipmentChecklist.belongsTo(models.RepairRequest, {
        foreignKey: 'repair_request_id',
        as: 'repairRequest'
      });
    }
    // 금형과 연결
    if (models.Mold) {
      RepairShipmentChecklist.belongsTo(models.Mold, {
        foreignKey: 'mold_id',
        as: 'mold'
      });
    }
    // 점검 항목들과 연결
    if (models.RepairShipmentChecklistItem) {
      RepairShipmentChecklist.hasMany(models.RepairShipmentChecklistItem, {
        foreignKey: 'checklist_id',
        as: 'items'
      });
    }
  };

  return RepairShipmentChecklist;
};
