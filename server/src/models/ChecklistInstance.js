module.exports = (sequelize, DataTypes) => {
  const ChecklistInstance = sequelize.define(
    'ChecklistInstance',
    {
      template_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      mold_id: {
        type: DataTypes.BIGINT,
        allowNull: false
      },
      plant_id: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      site_type: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'production | maker'
      },
      category: {
        type: DataTypes.STRING,
        allowNull: false,
        comment: 'daily | regular'
      },
      shot_counter: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'draft',
        comment: 'draft | submitted'
      },
      inspected_by: {
        type: DataTypes.BIGINT,
        allowNull: true
      },
      inspected_at: {
        type: DataTypes.DATE,
        allowNull: true
      }
    },
    {
      tableName: 'checklist_instances',
      underscored: true,
      timestamps: false
    }
  );

  ChecklistInstance.associate = (models) => {
    // N : 1 ChecklistTemplate
    if (models.ChecklistTemplate) {
      ChecklistInstance.belongsTo(models.ChecklistTemplate, {
        as: 'template',
        foreignKey: 'template_id'
      });
    }
    
    // N : 1 Mold
    if (models.Mold) {
      ChecklistInstance.belongsTo(models.Mold, {
        as: 'mold',
        foreignKey: 'mold_id'
      });
    }
    
    // N : 1 Plant
    if (models.Plant) {
      ChecklistInstance.belongsTo(models.Plant, {
        as: 'plant',
        foreignKey: 'plant_id'
      });
    }
    
    // 1 : N ChecklistAnswer
    if (models.ChecklistAnswer) {
      ChecklistInstance.hasMany(models.ChecklistAnswer, {
        as: 'answers',
        foreignKey: 'instance_id'
      });
    }
  };

  return ChecklistInstance;
};
