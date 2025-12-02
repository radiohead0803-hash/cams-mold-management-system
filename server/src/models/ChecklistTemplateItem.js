const { Model, DataTypes } = require('sequelize');

class ChecklistTemplateItem extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.BIGINT,
          primaryKey: true,
          autoIncrement: true
        },
        template_id: {
          type: DataTypes.BIGINT,
          allowNull: false
        },
        order_no: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        section: {
          type: DataTypes.STRING(50),
          comment: '공통, 냉각, 성형조건 등'
        },
        label: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        field_type: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: 'boolean | number | text'
        },
        required: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        ng_criteria: {
          type: DataTypes.STRING(100),
          comment: 'NG 판정 기준'
        },
        default_value: {
          type: DataTypes.STRING(100)
        }
      },
      {
        sequelize,
        modelName: 'ChecklistTemplateItem',
        tableName: 'checklist_template_items',
        timestamps: false,
        underscored: true
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.ChecklistTemplate, {
      foreignKey: 'template_id',
      as: 'template'
    });
  }
}

module.exports = ChecklistTemplateItem;
