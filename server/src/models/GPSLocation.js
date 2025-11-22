const { Model, DataTypes } = require('sequelize');

class GPSLocation extends Model {
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
        latitude: {
          type: DataTypes.DECIMAL(10, 8),
          allowNull: false
        },
        longitude: {
          type: DataTypes.DECIMAL(11, 8),
          allowNull: false
        },
        accuracy: {
          type: DataTypes.DECIMAL(10, 2),
          comment: '정확도 (미터)'
        },
        location_type: {
          type: DataTypes.STRING(50),
          comment: 'check, inspection, transfer, manual'
        },
        related_id: {
          type: DataTypes.INTEGER,
          comment: '관련 레코드 ID (check_id, inspection_id, etc)'
        },
        address: {
          type: DataTypes.STRING(500),
          comment: '역지오코딩 주소'
        }
      },
      {
        sequelize,
        modelName: 'GPSLocation',
        tableName: 'gps_locations',
        timestamps: false,
        createdAt: 'recorded_at',
        updatedAt: false,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['recorded_at'] }
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
  }
}

module.exports = GPSLocation;
