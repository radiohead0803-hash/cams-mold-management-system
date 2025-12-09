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
