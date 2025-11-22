module.exports = (sequelize, DataTypes) => {
  const ChecklistTemplateDeployment = sequelize.define('ChecklistTemplateDeployment', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    deployed_version: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    deployed_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    deployment_date: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    target_companies: {
      type: DataTypes.JSONB,
      comment: 'Array of company IDs to deploy to, null means all'
    },
    notes: {
      type: DataTypes.TEXT
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      comment: 'active, superseded, rolled_back'
    }
  }, {
    tableName: 'checklist_template_deployment',
    timestamps: false,
    indexes: [
      { fields: ['template_id'] },
      { fields: ['deployment_date'] },
      { fields: ['status'] }
    ]
  });

  ChecklistTemplateDeployment.associate = (models) => {
    ChecklistTemplateDeployment.belongsTo(models.ChecklistMasterTemplate, {
      foreignKey: 'template_id',
      as: 'template'
    });
  };

  return ChecklistTemplateDeployment;
};
