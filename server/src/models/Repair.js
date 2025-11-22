const { Model, DataTypes } = require('sequelize');

class Repair extends Model {
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
        request_number: {
          type: DataTypes.STRING(50),
          unique: true,
          comment: '수리요청번호'
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
        issue_type: {
          type: DataTypes.STRING(50),
          comment: 'crack, wear, deformation, malfunction, etc'
        },
        issue_description: {
          type: DataTypes.TEXT,
          allowNull: false
        },
        severity: {
          type: DataTypes.STRING(20),
          comment: 'low, medium, high, critical'
        },
        current_shots: {
          type: DataTypes.INTEGER
        },
        photos: {
          type: DataTypes.JSONB,
          comment: '이슈 사진'
        },
        documents: {
          type: DataTypes.JSONB,
          comment: '관련 문서'
        },
        estimated_cost: {
          type: DataTypes.DECIMAL(12, 2)
        },
        estimated_days: {
          type: DataTypes.INTEGER,
          comment: '예상 소요일'
        },
        target_completion_date: {
          type: DataTypes.DATEONLY
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'requested',
          comment: 'requested, liability_review, approved, in_repair, completed, rejected'
        },
        assigned_to: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: '담당 수리업체'
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
        started_at: {
          type: DataTypes.DATE
        },
        completed_at: {
          type: DataTypes.DATE
        },
        actual_cost: {
          type: DataTypes.DECIMAL(12, 2)
        },
        actual_days: {
          type: DataTypes.INTEGER
        },
        completion_notes: {
          type: DataTypes.TEXT
        }
      },
      {
        sequelize,
        modelName: 'Repair',
        tableName: 'repairs',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['request_number'] },
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
      foreignKey: 'requested_by',
      as: 'requester'
    });

    this.belongsTo(models.User, {
      foreignKey: 'assigned_to',
      as: 'assignee'
    });

    this.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });

    // TODO: Add RepairLiability and RepairHistory models
    // this.hasOne(models.RepairLiability, {
    //   foreignKey: 'repair_id',
    //   as: 'liability'
    // });

    // this.hasMany(models.RepairHistory, {
    //   foreignKey: 'repair_id',
    //   as: 'history'
    // });
  }
}

module.exports = Repair;
