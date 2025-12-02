const { Model, DataTypes } = require('sequelize');

class ChecklistInstance extends Model {
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
        mold_id: {
          type: DataTypes.BIGINT,
          allowNull: false
        },
        plant_id: {
          type: DataTypes.BIGINT
        },
        site_type: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: 'production | maker'
        },
        category: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: 'daily | regular'
        },
        shot_counter: {
          type: DataTypes.INTEGER
        },
        status: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'draft',
          comment: 'draft | submitted'
        },
        inspected_by: {
          type: DataTypes.BIGINT
        },
        inspected_at: {
          type: DataTypes.DATE
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'ChecklistInstance',
        tableName: 'checklist_instances',
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
    
    this.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });
    
    if (models.Plant) {
      this.belongsTo(models.Plant, {
        foreignKey: 'plant_id',
        as: 'plant'
      });
    }
    
    this.hasMany(models.ChecklistAnswer, {
      foreignKey: 'instance_id',
      as: 'answers'
    });
  }
}

module.exports = ChecklistInstance;
