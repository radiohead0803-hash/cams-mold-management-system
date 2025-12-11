const { Model, DataTypes } = require('sequelize');

class ProductionTransferChecklistItem extends Model {
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
        master_item_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'production_transfer_checklist_master',
            key: 'id'
          }
        },
        is_checked: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        check_result: {
          type: DataTypes.STRING(20),
          comment: 'pass, fail, na'
        },
        check_value: {
          type: DataTypes.TEXT,
          comment: '입력값 (필요시)'
        },
        remarks: {
          type: DataTypes.TEXT,
          comment: '비고'
        },
        attachment_url: {
          type: DataTypes.TEXT
        },
        attachment_filename: {
          type: DataTypes.STRING(255)
        },
        checked_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        checked_at: {
          type: DataTypes.DATE
        }
      },
      {
        sequelize,
        modelName: 'ProductionTransferChecklistItem',
        tableName: 'production_transfer_checklist_items',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['transfer_request_id'] },
          { fields: ['master_item_id'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.ProductionTransferRequest, {
      foreignKey: 'transfer_request_id',
      as: 'transferRequest'
    });

    this.belongsTo(models.ProductionTransferChecklistMaster, {
      foreignKey: 'master_item_id',
      as: 'masterItem'
    });

    this.belongsTo(models.User, {
      foreignKey: 'checked_by',
      as: 'checker'
    });
  }
}

module.exports = ProductionTransferChecklistItem;
