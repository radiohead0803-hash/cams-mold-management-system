const { Model, DataTypes } = require('sequelize');

class ChecklistTemplate extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true
        },
        name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        category: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: 'daily | regular'
        },
        shot_interval: {
          type: DataTypes.INTEGER,
          comment: '정기점검 샷 간격'
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        version: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'ChecklistTemplate',
        tableName: 'checklist_templates',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.hasMany(models.ChecklistTemplateItem, {
      foreignKey: 'template_id',
      as: 'items'
    });
    
    this.hasMany(models.ChecklistInstance, {
      foreignKey: 'template_id',
      as: 'instances'
    });
  }
}

module.exports = ChecklistTemplate;
