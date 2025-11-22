const { Model, DataTypes } = require('sequelize');

class Transfer extends Model {
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
        transfer_number: {
          type: DataTypes.STRING(50),
          unique: true,
          comment: '이관번호'
        },
        transfer_type: {
          type: DataTypes.STRING(50),
          comment: 'maker_to_plant, plant_to_plant, plant_to_storage'
        },
        from_location: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        to_location: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        from_party_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: '이관 출발지 담당자'
        },
        to_party_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: '이관 도착지 담당자'
        },
        requested_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        request_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        planned_transfer_date: {
          type: DataTypes.DATEONLY
        },
        actual_transfer_date: {
          type: DataTypes.DATEONLY
        },
        reason: {
          type: DataTypes.TEXT,
          comment: '이관 사유'
        },
        current_shots: {
          type: DataTypes.INTEGER
        },
        mold_condition: {
          type: DataTypes.STRING(50),
          comment: 'excellent, good, fair, poor'
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'requested',
          comment: 'requested, 4m_preparation, ready_to_ship, in_transit, delivered, confirmed, rejected'
        },
        documents: {
          type: DataTypes.JSONB,
          comment: '이관 문서'
        },
        photos: {
          type: DataTypes.JSONB,
          comment: '이관 전 사진'
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
        shipped_at: {
          type: DataTypes.DATE
        },
        delivered_at: {
          type: DataTypes.DATE
        },
        confirmed_at: {
          type: DataTypes.DATE
        },
        notes: {
          type: DataTypes.TEXT
        }
      },
      {
        sequelize,
        modelName: 'Transfer',
        tableName: 'transfers',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['transfer_number'] },
          { fields: ['status'] },
          { fields: ['request_date'] }
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
      foreignKey: 'from_party_id',
      as: 'fromParty'
    });

    this.belongsTo(models.User, {
      foreignKey: 'to_party_id',
      as: 'toParty'
    });

    this.belongsTo(models.User, {
      foreignKey: 'requested_by',
      as: 'requester'
    });

    this.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });

    // TODO: Add Transfer4M, TransferConfirmation, and TransferHistory models
    // this.hasOne(models.Transfer4M, {
    //   foreignKey: 'transfer_id',
    //   as: 'fourM'
    // });

    // this.hasOne(models.TransferConfirmation, {
    //   foreignKey: 'transfer_id',
    //   as: 'confirmation'
    // });

    // this.hasMany(models.TransferHistory, {
    //   foreignKey: 'transfer_id',
    //   as: 'history'
    // });
  }
}

module.exports = Transfer;
