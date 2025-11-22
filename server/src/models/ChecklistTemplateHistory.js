module.exports = (sequelize, DataTypes) => {
  const ChecklistTemplateHistory = sequelize.define('ChecklistTemplateHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    change_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'created, updated, item_added, item_removed, item_modified'
    },
    changed_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    change_description: {
      type: DataTypes.TEXT
    },
    changes_json: {
      type: DataTypes.JSONB,
      comment: 'Detailed changes in JSON format'
    },
    changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'checklist_template_history',
    timestamps: false,
    indexes: [
      { fields: ['template_id'] },
      { fields: ['version'] },
      { fields: ['changed_at'] }
    ]
  });

  ChecklistTemplateHistory.associate = (models) => {
    ChecklistTemplateHistory.belongsTo(models.ChecklistMasterTemplate, {
      foreignKey: 'template_id',
      as: 'template'
    });
  };

  return ChecklistTemplateHistory;
};
