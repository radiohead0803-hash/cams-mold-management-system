const { Model, DataTypes } = require('sequelize');

/**
 * 버전-항목 매핑 테이블
 * - 특정 버전에 포함된 항목 목록
 */
class ChecklistVersionItemMap extends Model {
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
        is_required: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          comment: '필수 항목 여부'
        },
        sort_order: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        }
      },
      {
        sequelize,
        modelName: 'ChecklistVersionItemMap',
        tableName: 'checklist_version_item_maps',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['checklist_version_id'] },
          { fields: ['item_id'] },
          { fields: ['checklist_version_id', 'item_id'], unique: true }
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
  }
}

module.exports = ChecklistVersionItemMap;
