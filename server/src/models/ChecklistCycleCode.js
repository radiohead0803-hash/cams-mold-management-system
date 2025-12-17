const { Model, DataTypes } = require('sequelize');

/**
 * 점검주기 코드 테이블
 * - DAILY (매일/생산전)
 * - SHOT 기반 (20000, 50000, 80000, 100000)
 */
class ChecklistCycleCode extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        label: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          comment: 'DAILY, 20000, 50000, 80000, 100000'
        },
        cycle_type: {
          type: DataTypes.ENUM('daily', 'shots'),
          allowNull: false,
          comment: 'daily: 날짜 기반, shots: 타수 기반'
        },
        cycle_shots: {
          type: DataTypes.INTEGER,
          comment: 'shots 타입인 경우 주기 타수 (예: 20000)'
        },
        description: {
          type: DataTypes.TEXT
        },
        sort_order: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        }
      },
      {
        sequelize,
        modelName: 'ChecklistCycleCode',
        tableName: 'checklist_cycle_codes',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['label'], unique: true },
          { fields: ['cycle_type'] },
          { fields: ['sort_order'] }
        ]
      }
    );
  }

  static associate(models) {
    this.hasMany(models.ChecklistItemCycleMap, {
      foreignKey: 'cycle_code_id',
      as: 'itemMaps'
    });
    this.hasMany(models.InspectionSchedule, {
      foreignKey: 'cycle_code_id',
      as: 'schedules'
    });
  }
}

module.exports = ChecklistCycleCode;
