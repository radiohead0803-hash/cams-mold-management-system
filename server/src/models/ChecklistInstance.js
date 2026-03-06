module.exports = (sequelize, DataTypes) => {
  const ChecklistInstance = sequelize.define(
    'ChecklistInstance',
    {
      template_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      mold_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      plant_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      site_type: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'production | maker'
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'daily | regular'
      },
      shot_counter: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'draft',
        comment: 'draft | pending_approval | completed | rejected'
      },
      inspected_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      inspected_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      check_date: {
        type: DataTypes.DATE,
        allowNull: true
      },
      results: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: '점검 결과 데이터'
      },
      production_quantity: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      summary: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: '점검 요약 (양호/주의/불량 카운트)'
      },
      inspector_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      inspector_name: {
        type: DataTypes.STRING(100),
        allowNull: true
      },
      approver_id: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: '승인자 ID'
      },
      approved_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      approved_at: {
        type: DataTypes.DATE,
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
      requested_at: {
        type: DataTypes.DATE,
        allowNull: true
      },
      created_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      }
    },
    {
      tableName: 'checklist_instances',
      underscored: true,
      timestamps: false
    }
  );

  ChecklistInstance.associate = (models) => {
    // N : 1 ChecklistTemplate
    if (models.ChecklistTemplate) {
      ChecklistInstance.belongsTo(models.ChecklistTemplate, {
        as: 'template',
        foreignKey: 'template_id'
      });
    }
    
    // N : 1 Mold
    if (models.Mold) {
      ChecklistInstance.belongsTo(models.Mold, {
        as: 'mold',
        foreignKey: 'mold_id'
      });
    }
    
    // N : 1 Plant
    if (models.Plant) {
      ChecklistInstance.belongsTo(models.Plant, {
        as: 'plant',
        foreignKey: 'plant_id'
      });
    }
    
    // 1 : N ChecklistAnswer
    if (models.ChecklistAnswer) {
      ChecklistInstance.hasMany(models.ChecklistAnswer, {
        as: 'answers',
        foreignKey: 'instance_id'
      });
    }
  };

  return ChecklistInstance;
};
