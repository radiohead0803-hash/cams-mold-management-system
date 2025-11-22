const { Model, DataTypes } = require('sequelize');

class DailyCheck extends Model {
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
        check_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        shift: {
          type: DataTypes.STRING(20),
          comment: 'day, night'
        },
        current_shots: {
          type: DataTypes.INTEGER,
          comment: '점검 시점 타수'
        },
        production_quantity: {
          type: DataTypes.INTEGER,
          comment: '생산 수량'
        },
        gps_latitude: {
          type: DataTypes.DECIMAL(10, 8)
        },
        gps_longitude: {
          type: DataTypes.DECIMAL(11, 8)
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'in_progress',
          comment: 'in_progress, completed, approved'
        },
        overall_status: {
          type: DataTypes.STRING(20),
          comment: 'good, warning, bad'
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
        modelName: 'DailyCheck',
        tableName: 'daily_checks',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['check_date'] },
          { fields: ['status'] }
        ]
      }
    );
  }

  static associate(models) {
    // 금형과의 관계
    this.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });

    // 작성자와의 관계
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // 승인자와의 관계
    this.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });

    // 점검 항목과의 관계
    this.hasMany(models.DailyCheckItem, {
      foreignKey: 'check_id',
      as: 'items'
    });
  }
}

module.exports = DailyCheck;
