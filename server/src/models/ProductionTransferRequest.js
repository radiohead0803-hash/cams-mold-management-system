const { Model, DataTypes } = require('sequelize');

class ProductionTransferRequest extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        request_number: {
          type: DataTypes.STRING(50),
          unique: true,
          allowNull: false,
          comment: '신청번호 (자동생성)'
        },
        mold_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'molds',
            key: 'id'
          }
        },
        mold_spec_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'mold_specifications',
            key: 'id'
          }
        },
        from_maker_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: '제작처'
        },
        to_plant_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: '이관 대상 생산처'
        },
        requested_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: '신청일'
        },
        planned_transfer_date: {
          type: DataTypes.DATEONLY,
          comment: '예정 이관일'
        },
        actual_transfer_date: {
          type: DataTypes.DATEONLY,
          comment: '실제 이관일'
        },
        status: {
          type: DataTypes.STRING(30),
          allowNull: false,
          defaultValue: 'draft',
          comment: 'draft, checklist_in_progress, pending_approval, approved, rejected, transferred, cancelled'
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
        },
        rejection_reason: {
          type: DataTypes.TEXT
        },
        notes: {
          type: DataTypes.TEXT
        },
        created_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'ProductionTransferRequest',
        tableName: 'production_transfer_requests',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['status'] },
          { fields: ['requested_date'] },
          { fields: ['from_maker_id'] },
          { fields: ['to_plant_id'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });

    this.belongsTo(models.MoldSpecification, {
      foreignKey: 'mold_spec_id',
      as: 'moldSpecification'
    });

    this.belongsTo(models.User, {
      foreignKey: 'from_maker_id',
      as: 'fromMaker'
    });

    this.belongsTo(models.User, {
      foreignKey: 'to_plant_id',
      as: 'toPlant'
    });

    this.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });

    this.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    this.hasMany(models.ProductionTransferChecklistItem, {
      foreignKey: 'transfer_request_id',
      as: 'checklistItems'
    });

    this.hasMany(models.ProductionTransferApproval, {
      foreignKey: 'transfer_request_id',
      as: 'approvals'
    });
  }

  // 신청번호 자동 생성
  static async generateRequestNumber() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const prefix = `PTR-${year}${month}`;
    
    const lastRequest = await this.findOne({
      where: {
        request_number: {
          [require('sequelize').Op.like]: `${prefix}%`
        }
      },
      order: [['request_number', 'DESC']]
    });

    let sequence = 1;
    if (lastRequest) {
      const lastSequence = parseInt(lastRequest.request_number.slice(-4));
      sequence = lastSequence + 1;
    }

    return `${prefix}-${String(sequence).padStart(4, '0')}`;
  }
}

module.exports = ProductionTransferRequest;
