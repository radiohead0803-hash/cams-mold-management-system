module.exports = (sequelize, DataTypes) => {
  const ChecklistTemplateItem = sequelize.define(
    'ChecklistTemplateItem',
    {
      template_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      order_no: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      section: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: '공통, 냉각, 성형조건 등'
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false
      },
      field_type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'boolean | number | text'
      },
      required: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      ng_criteria: {
        type: DataTypes.STRING,
        allowNull: true,
        comment: 'NG 판정 기준'
      },
      default_value: {
        type: DataTypes.STRING,
        allowNull: true
      }
    },
    {
      tableName: 'checklist_template_items',
      underscored: true,
      timestamps: false
    }
  );

  ChecklistTemplateItem.associate = (models) => {
    // N : 1 ChecklistTemplate
    ChecklistTemplateItem.belongsTo(models.ChecklistTemplate, {
      as: 'template',
      foreignKey: 'template_id'
    });
  };

  return ChecklistTemplateItem;
};
