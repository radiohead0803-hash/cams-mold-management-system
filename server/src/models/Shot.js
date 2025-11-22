const { Model, DataTypes } = require('sequelize');

class Shot extends Model {
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
        recorded_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        recorded_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        shift: {
          type: DataTypes.STRING(20),
          comment: 'day, night'
        },
        previous_shots: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        current_shots: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        shots_increment: {
          type: DataTypes.INTEGER,
          allowNull: false
        },
        production_quantity: {
          type: DataTypes.INTEGER,
          comment: '생산 수량'
        },
        cavity_count: {
          type: DataTypes.INTEGER
        },
        defect_count: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        notes: {
          type: DataTypes.TEXT
        },
        source: {
          type: DataTypes.STRING(50),
          comment: 'daily_check, manual, auto_sync'
        }
      },
      {
        sequelize,
        modelName: 'Shot',
        tableName: 'shots',
        timestamps: false,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['recorded_date'] }
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
      foreignKey: 'recorded_by',
      as: 'recorder'
    });
  }
}

module.exports = Shot;
