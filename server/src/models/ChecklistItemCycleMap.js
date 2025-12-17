const { Model, DataTypes } = require('sequelize');

/**
 * 항목-주기 매핑 테이블 (M:N)
 * - UI 매트릭스(● 체크) 형태의 저장형
 * - 특정 버전에서 특정 항목이 어떤 주기에 적용되는지
 */
class ChecklistItemCycleMap extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        checklist_version_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'checklist_master_versions',
            key: 'id'
          }
        },
        item_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
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
        is_enabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          comment: '해당 주기에서 이 항목 활성화 여부'
        }
      },
      {
        sequelize,
        modelName: 'ChecklistItemCycleMap',
        tableName: 'checklist_item_cycle_maps',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['checklist_version_id'] },
          { fields: ['item_id'] },
          { fields: ['cycle_code_id'] },
          { fields: ['checklist_version_id', 'item_id', 'cycle_code_id'], unique: true }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.ChecklistMasterVersion, {
      foreignKey: 'checklist_version_id',
      as: 'version'
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

module.exports = ChecklistItemCycleMap;
