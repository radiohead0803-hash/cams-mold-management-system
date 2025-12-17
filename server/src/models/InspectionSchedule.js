const { Model, DataTypes } = require('sequelize');

/**
 * 점검 스케줄 (루프 기반 자동 갱신)
 * - 특정 금형에서 특정 항목이 특정 주기에 의해 반복 수행
 * - 점검 완료 시 다음 due 자동 생성
 */
class InspectionSchedule extends Model {
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
          comment: '현재 적용(deployed) 버전'
        },
        item_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'checklist_items_master',
            key: 'id'
          }
        },
        cycle_code_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'checklist_cycle_codes',
            key: 'id'
          }
        },
        last_done_shots: {
          type: DataTypes.INTEGER,
          comment: '마지막 점검 시 타수'
        },
        next_due_shots: {
          type: DataTypes.INTEGER,
          comment: '다음 점검 기준 타수'
        },
        last_done_at: {
          type: DataTypes.DATE,
          comment: '마지막 점검 완료일'
        },
        next_due_date: {
          type: DataTypes.DATEONLY,
          comment: 'DAILY 타입용 다음 점검 예정일'
        },
        status: {
          type: DataTypes.ENUM('upcoming', 'due', 'overdue', 'completed'),
          defaultValue: 'upcoming',
          comment: 'upcoming: 예정, due: 도래, overdue: 지연, completed: 완료'
        },
        overdue_percentage: {
          type: DataTypes.DECIMAL(5, 2),
          comment: '초과 비율 (%)'
        }
      },
      {
        sequelize,
        modelName: 'InspectionSchedule',
        tableName: 'inspection_schedules',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['cycle_code_id'] },
          { fields: ['status'] },
          { fields: ['mold_id', 'cycle_code_id', 'status'] },
          { fields: ['next_due_shots'] },
          { fields: ['next_due_date'] }
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
    this.belongsTo(models.ChecklistItemMasterNew, {
      foreignKey: 'item_id',
      as: 'item'
    });
    this.belongsTo(models.ChecklistCycleCode, {
      foreignKey: 'cycle_code_id',
      as: 'cycleCode'
    });
  }
}

module.exports = InspectionSchedule;
