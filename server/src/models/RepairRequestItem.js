module.exports = (sequelize, DataTypes) => {
  const RepairRequestItem = sequelize.define(
    'RepairRequestItem',
    {
      repair_request_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      checklist_answer_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      item_label: {
        type: DataTypes.STRING(200),
        allowNull: false
      },
      item_section: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      value_text: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      value_bool: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      is_ng: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      }
    },
    {
      tableName: 'repair_request_items',
      underscored: true,
      timestamps: false
    }
  );

  RepairRequestItem.associate = (models) => {
    // N : 1 RepairRequest
    if (models.RepairRequest) {
      RepairRequestItem.belongsTo(models.RepairRequest, {
        as: 'request',
        foreignKey: 'repair_request_id'
      });
    }

    // N : 1 ChecklistAnswer
    if (models.ChecklistAnswer) {
      RepairRequestItem.belongsTo(models.ChecklistAnswer, {
        as: 'answer',
        foreignKey: 'checklist_answer_id'
      });
    }
  };

  return RepairRequestItem;
};
