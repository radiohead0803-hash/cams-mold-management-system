module.exports = (sequelize, DataTypes) => {
  const ChecklistAnswer = sequelize.define(
    'ChecklistAnswer',
    {
      instance_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      item_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      value_bool: {
        type: DataTypes.BOOLEAN,
        allowNull: true
      },
      value_number: {
        type: DataTypes.DECIMAL,
        allowNull: true
      },
      value_text: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      is_ng: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      tableName: 'checklist_answers',
      underscored: true,
      timestamps: false
    }
  );

  ChecklistAnswer.associate = (models) => {
    // N : 1 ChecklistInstance
    if (models.ChecklistInstance) {
      ChecklistAnswer.belongsTo(models.ChecklistInstance, {
        as: 'instance',
        foreignKey: 'instance_id'
      });
    }
    
    // N : 1 ChecklistTemplateItem
    if (models.ChecklistTemplateItem) {
      ChecklistAnswer.belongsTo(models.ChecklistTemplateItem, {
        as: 'item',
        foreignKey: 'item_id'
      });
    }
  };

  return ChecklistAnswer;
};
