module.exports = (sequelize, DataTypes) => {
  const ChecklistTemplateItem = sequelize.define('ChecklistTemplateItem', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    template_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    item_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    item_order: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    is_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    requires_photo: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    guide_text: {
      type: DataTypes.TEXT
    },
    guide_image_url: {
      type: DataTypes.STRING(500)
    },
    default_options: {
      type: DataTypes.JSONB,
      comment: 'JSON array of default options for this item'
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'checklist_template_items',
    timestamps: false,
    indexes: [
      { fields: ['template_id'] },
      { fields: ['category'] },
      { fields: ['item_order'] }
    ]
  });

  ChecklistTemplateItem.associate = (models) => {
    ChecklistTemplateItem.belongsTo(models.ChecklistMasterTemplate, {
      foreignKey: 'template_id',
      as: 'template'
    });
  };

  return ChecklistTemplateItem;
};
