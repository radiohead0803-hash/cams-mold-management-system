module.exports = (sequelize, DataTypes) => {
  const ChecklistMasterTemplate = sequelize.define('ChecklistMasterTemplate', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    template_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    template_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'daily, periodic_20k, periodic_50k, periodic_100k, transfer'
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1
    },
    description: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    created_by: {
      type: DataTypes.INTEGER
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'checklist_master_templates',
    timestamps: false,
    indexes: [
      { fields: ['template_type'] },
      { fields: ['is_active'] },
      { fields: ['version'] }
    ]
  });

  ChecklistMasterTemplate.associate = (models) => {
    ChecklistMasterTemplate.hasMany(models.ChecklistTemplateItem, {
      foreignKey: 'template_id',
      as: 'items'
    });
    ChecklistMasterTemplate.hasMany(models.ChecklistTemplateDeployment, {
      foreignKey: 'template_id',
      as: 'deployments'
    });
    ChecklistMasterTemplate.hasMany(models.ChecklistTemplateHistory, {
      foreignKey: 'template_id',
      as: 'history'
    });
  };

  return ChecklistMasterTemplate;
};
