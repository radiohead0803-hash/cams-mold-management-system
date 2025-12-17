const { Model, DataTypes } = require('sequelize');

/**
 * 점검 실행 헤더 (인스턴스)
 * - 특정 금형에서 특정 주기로 수행된 점검 기록
 */
class InspectionInstanceNew extends Model {
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
        checklist_version_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'checklist_master_versions',
            key: 'id'
          },
          comment: '배포된 버전 스냅샷 참조'
        },
        cycle_code_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'checklist_cycle_codes',
            key: 'id'
          },
          comment: 'DAILY 또는 20K/50K/80K/100K'
        },
        status: {
          type: DataTypes.ENUM('draft', 'submitted', 'approved'),
          defaultValue: 'draft'
        },
        current_shots: {
          type: DataTypes.INTEGER,
          comment: '점검 시점의 누적타수'
        },
        inspection_date: {
          type: DataTypes.DATEONLY,
          allowNull: false
        },
        gps_latitude: {
          type: DataTypes.DECIMAL(10, 8)
        },
        gps_longitude: {
          type: DataTypes.DECIMAL(11, 8)
        },
        overall_result: {
          type: DataTypes.ENUM('good', 'caution', 'bad'),
          comment: '전체 결과'
        },
        notes: {
          type: DataTypes.TEXT
        },
        submitted_at: {
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
        },
        created_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'InspectionInstanceNew',
        tableName: 'inspection_instances',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['checklist_version_id'] },
          { fields: ['cycle_code_id'] },
          { fields: ['status'] },
          { fields: ['inspection_date'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });
    this.belongsTo(models.ChecklistMasterVersion, {
      foreignKey: 'checklist_version_id',
      as: 'checklistVersion'
    });
    this.belongsTo(models.ChecklistCycleCode, {
      foreignKey: 'cycle_code_id',
      as: 'cycleCode'
    });
    this.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
    this.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });
    this.hasMany(models.InspectionInstanceItem, {
      foreignKey: 'inspection_instance_id',
      as: 'items'
    });
  }
}

module.exports = InspectionInstanceNew;
