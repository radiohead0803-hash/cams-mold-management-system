module.exports = (sequelize, DataTypes) => {
  const ChecklistTemplate = sequelize.define(
    'ChecklistTemplate',
    {
      code: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'daily | regular'
      },
      shot_interval: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '정기점검 샷 간격'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      version: {
        type: DataTypes.INTEGER,
        defaultValue: 1
      }
    },
    {
      tableName: 'checklist_templates',
      underscored: true,
      timestamps: false
    }
  );

  ChecklistTemplate.associate = (models) => {
    // ChecklistTemplate 1 : N ChecklistTemplateItem
    ChecklistTemplate.hasMany(models.ChecklistTemplateItem, {
      as: 'items',
      foreignKey: 'template_id'
    });
    
    // ChecklistTemplate 1 : N ChecklistInstance
    if (models.ChecklistInstance) {
      ChecklistTemplate.hasMany(models.ChecklistInstance, {
        as: 'instances',
        foreignKey: 'template_id'
      });
    }
  };

  return ChecklistTemplate;
};
