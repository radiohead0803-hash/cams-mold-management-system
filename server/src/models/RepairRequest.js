module.exports = (sequelize, DataTypes) => {
  const RepairRequest = sequelize.define(
    'RepairRequest',
    {
      request_number: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '수리요청 번호 (RR-YYYYMMDD-XXX)'
      },
      mold_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      mold_spec_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      plant_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      checklist_instance_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'requested',
        comment: 'requested | approved | assigned | in_progress | done | confirmed | closed | rejected'
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: true,
        defaultValue: 'normal',
        comment: 'low | normal | high'
      },
      severity: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'medium',
        comment: 'low | medium | high | urgent'
      },
      urgency: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'normal',
        comment: 'low | normal | high | urgent'
      },
      request_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'ng_repair | preventive | modification'
      },
      issue_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '불량 유형 (SHORT_SHOT, FLASH, BURN, CRACK, etc.)'
      },
      issue_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '불량 상세 설명'
      },
      ng_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'NG 유형'
      },
      requester_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      requester_company_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      requested_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      requested_role: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'production | maker | hq'
      },
      requested_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      title: {
        type: DataTypes.STRING(200),
        allowNull: true
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      estimated_cost: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        comment: '예상 수리 비용'
      },
      actual_cost: {
        type: DataTypes.DECIMAL(15, 2),
        allowNull: true,
        comment: '실제 수리 비용'
      },
      blame_party: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '귀책 당사자 (maker | plant | hq | shared | other)'
      },
      blame_percentage: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '귀책 비율 (%)'
      },
      blame_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      blame_confirmed: {
        type: DataTypes.BOOLEAN,
        allowNull: true,
        defaultValue: false
      },
      blame_confirmed_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      blame_confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      approved_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      approved_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      approval_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      rejected_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      rejected_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      assigned_to_company_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      assigned_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      assigned_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      assignment_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      started_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      completed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      confirmed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      confirmed_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      closed_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      progress_notes: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      estimated_completion_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      // ===== 협력사 작성항목 (프론트엔드 폼 필드) =====
      problem: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '문제 내용'
      },
      cause_and_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '원인 및 발생사유'
      },
      problem_source: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '문제점 출처'
      },
      occurred_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '발생일자'
      },
      manager_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '추진담당 이름'
      },
      requester_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '요청자 이름'
      },
      car_model: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '대상차종'
      },
      part_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '품번'
      },
      part_name: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '품명'
      },
      occurrence_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: '신규',
        comment: '발생구분 (신규/재발)'
      },
      production_site: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '생산처'
      },
      production_manager: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '담당자(생산처)'
      },
      contact: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '연락처'
      },
      production_shot: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '생산수량(SHOT)'
      },
      maker: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '제작처'
      },
      operation_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        defaultValue: '양산',
        comment: '운영구분 (양산/개발 등)'
      },
      problem_type: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '문제유형 (내구성/외관/치수 등)'
      },
      repair_category: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '수리 카테고리 (EO/현실화/돌발)'
      },
      repair_cost: {
        type: DataTypes.DECIMAL(12, 0),
        allowNull: true,
        comment: '금형수정비'
      },
      completion_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '완료일자'
      },
      temporary_action: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '임시대책/조치사항'
      },
      root_cause_action: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '근본대책'
      },
      mold_arrival_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '금형입고일'
      },
      repair_start_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '수리 시작일'
      },
      repair_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '수리 완료일'
      },
      stock_schedule_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '재고확보일정'
      },
      stock_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '재고확보수량'
      },
      stock_unit: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: 'EA',
        comment: '재고확보단위'
      },
      shortage_expected_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '과부족 예상일'
      },
      mold_arrival_request_datetime: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '금형입고요청일시'
      },
      repair_company: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '금형수정처'
      },
      repair_duration: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '금형수정기간'
      },
      management_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '관리구분 (전산공유 L1 등)'
      },
      sign_off_status: {
        type: DataTypes.STRING(100),
        allowNull: true,
        defaultValue: '제출되지 않음',
        comment: '사인 오프 상태'
      },
      representative_part_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '대표품번'
      },
      order_company: {
        type: DataTypes.STRING(200),
        allowNull: true,
        comment: '발주처'
      },
      // ===== 수리처 선정 =====
      repair_shop_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '수리처 유형 (자체/외주)'
      },
      repair_shop_selected_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '수리처 선정자'
      },
      repair_shop_selected_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '수리처 선정일'
      },
      repair_shop_approval_status: {
        type: DataTypes.STRING(20),
        allowNull: true,
        defaultValue: '대기',
        comment: '수리처 승인상태 (대기/승인/반려)'
      },
      repair_shop_approved_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '수리처 승인자'
      },
      repair_shop_approved_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '수리처 승인일'
      },
      repair_shop_rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '수리처 반려사유'
      },
      // ===== 귀책 협의 =====
      liability_type: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '귀책 유형 (제작처/생산처/공동/기타)'
      },
      liability_ratio_maker: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '제작처 귀책비율 (%)'
      },
      liability_ratio_plant: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '생산처 귀책비율 (%)'
      },
      liability_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '귀책 판정 사유'
      },
      liability_decided_by: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '귀책 판정자'
      },
      liability_decided_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        comment: '귀책 판정일'
      },
      related_files: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: [],
        comment: '관련 파일'
      }
    },
    {
      tableName: 'repair_requests',
      underscored: true,
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  RepairRequest.associate = (models) => {
    // N : 1 Mold
    if (models.Mold) {
      RepairRequest.belongsTo(models.Mold, {
        as: 'mold',
        foreignKey: 'mold_id'
      });
    }

    // N : 1 ChecklistInstance
    if (models.ChecklistInstance) {
      RepairRequest.belongsTo(models.ChecklistInstance, {
        as: 'checklist',
        foreignKey: 'checklist_instance_id'
      });
    }

    // 1 : N RepairRequestItem
    if (models.RepairRequestItem) {
      RepairRequest.hasMany(models.RepairRequestItem, {
        as: 'items',
        foreignKey: 'repair_request_id'
      });
    }
  };

  return RepairRequest;
};
