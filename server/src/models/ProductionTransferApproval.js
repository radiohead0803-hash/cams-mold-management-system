const { Model, DataTypes } = require('sequelize');

class ProductionTransferApproval extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        transfer_request_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'production_transfer_requests',
            key: 'id'
          }
        },
        approval_step: {
          type: DataTypes.INTEGER,
          defaultValue: 1,
          comment: '승인 단계'
        },
        approval_type: {
          type: DataTypes.STRING(30),
          allowNull: false,
          comment: 'submit, approve, reject, cancel'
        },
        approver_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        approver_name: {
          type: DataTypes.STRING(100)
        },
        approver_role: {
          type: DataTypes.STRING(50)
        },
        decision: {
          type: DataTypes.STRING(20),
          comment: 'approved, rejected, pending'
        },
        comments: {
          type: DataTypes.TEXT
        },
        action_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'ProductionTransferApproval',
        tableName: 'production_transfer_approvals',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['transfer_request_id'] },
          { fields: ['approver_id'] },
          { fields: ['approval_type'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.ProductionTransferRequest, {
      foreignKey: 'transfer_request_id',
      as: 'transferRequest'
    });

    this.belongsTo(models.User, {
      foreignKey: 'approver_id',
      as: 'approver'
    });
  }
}

module.exports = ProductionTransferApproval;
