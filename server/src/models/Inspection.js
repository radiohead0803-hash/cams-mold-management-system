const { Model, DataTypes } = require('sequelize');

class Inspection extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        mold_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'molds',
            key: 'id'
          }
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        inspection_type: {
          type: DataTypes.STRING(20),
          allowNull: false,
          comment: '20k, 50k, 80k, 100k'
        },
        inspection_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        current_shots: {
          type: DataTypes.INTEGER
        },
        gps_latitude: {
          type: DataTypes.DECIMAL(10, 8)
        },
        gps_longitude: {
          type: DataTypes.DECIMAL(11, 8)
        },
        cleaning_method: {
          type: DataTypes.STRING(100),
          comment: '세척제 종류'
        },
        cleaning_ratio: {
          type: DataTypes.STRING(100),
          comment: '희석 비율/온도'
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'in_progress',
          comment: 'in_progress, completed, approved'
        },
        overall_status: {
          type: DataTypes.STRING(20),
          comment: 'good, maintenance_needed, repair_needed'
        },
        notes: {
          type: DataTypes.TEXT
        },
        completed_at: {
          type: DataTypes.DATE
        },
        approved_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approved_at: {
          type: DataTypes.DATE
        }
      },
      {
        sequelize,
        modelName: 'Inspection',
        tableName: 'inspections',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['inspection_type'] },
          { fields: ['inspection_date'] },
          { fields: ['status'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });

    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    this.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });

    this.hasMany(models.InspectionItem, {
      foreignKey: 'inspection_id',
      as: 'items'
    });
  }
}

module.exports = Inspection;
