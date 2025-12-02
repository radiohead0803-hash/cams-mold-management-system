const { Model, DataTypes } = require('sequelize');

class ChecklistAnswer extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        instance_id: {
          type: DataTypes.BIGINT,
          allowNull: false
        },
        item_id: {
          type: DataTypes.BIGINT,
          allowNull: false
        },
        value_bool: {
          type: DataTypes.BOOLEAN
        },
        value_number: {
          type: DataTypes.DECIMAL
        },
        value_text: {
          type: DataTypes.TEXT
        },
        is_ng: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        }
      },
      {
        sequelize,
        modelName: 'ChecklistAnswer',
        tableName: 'checklist_answers',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.ChecklistInstance, {
      foreignKey: 'instance_id',
      as: 'instance'
    });
    
    this.belongsTo(models.ChecklistTemplateItem, {
      foreignKey: 'item_id',
      as: 'item'
    });
  }
}

module.exports = ChecklistAnswer;
