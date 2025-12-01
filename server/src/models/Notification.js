const { Model, DataTypes } = require('sequelize');

class Notification extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        notification_type: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: 'location_moved, location_back, ng_detected, repair_status, inspection_due, repair_request, transfer_request, approval_needed, etc'
        },
        title: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        message: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        priority: {
          type: DataTypes.STRING(20),
          defaultValue: 'normal',
          comment: 'low, normal, high, urgent'
        },
        related_type: {
          type: DataTypes.STRING(50),
          comment: 'mold, check, inspection, repair, transfer'
        },
        related_id: {
          type: DataTypes.INTEGER,
          comment: '관련 레코드 ID'
        },
        action_url: {
          type: DataTypes.STRING(500),
          comment: '액션 URL'
        },
        is_read: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        read_at: {
          type: DataTypes.DATE
        }
      },
      {
        sequelize,
        modelName: 'Notification',
        tableName: 'notifications',
        timestamps: false,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
          { fields: ['user_id'] },
          { fields: ['is_read'] },
          { fields: ['created_at'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });
    
    // Mold 관계 추가 (related_type이 'mold'일 때 사용)
    if (models.Mold) {
      this.belongsTo(models.Mold, {
        foreignKey: 'related_id',
        as: 'mold',
        constraints: false
      });
    }
  }
}

module.exports = Notification;
