module.exports = (sequelize, DataTypes) => {
  const RepairRequest = sequelize.define(
    'RepairRequest',
    {
      mold_id: {
        type: DataTypes.BIGINT,
        allowNull: false
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
        comment: 'requested | accepted | in_progress | done | rejected'
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'normal',
        comment: 'low | normal | high'
      },
      request_type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'ng_repair | preventive | modification'
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
      title: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
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
