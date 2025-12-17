const { Model, DataTypes } = require('sequelize');

/**
 * 점검항목 마스터 (통합)
 * - 일상/정기/세척/습합 구분 없이 단일 마스터
 * - 디지털 필드로 관리
 */
class ChecklistItemMasterNew extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        major_category: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: '대분류: 금형 외관 점검, 냉각 시스템, 작동부 점검 등'
        },
        item_name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: '점검항목명'
        },
        description: {
          type: DataTypes.TEXT,
          comment: '점검내용 (서술형)'
        },
        check_method: {
          type: DataTypes.TEXT,
          comment: '점검방법 (서술형)'
        },
        required_photo: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '사진 필수 여부'
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
        modelName: 'ChecklistItemMasterNew',
        tableName: 'checklist_items_master',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['major_category'] },
          { fields: ['is_active'] },
          { fields: ['sort_order'] }
        ]
      }
    );
  }

  static associate(models) {
    this.hasMany(models.ChecklistVersionItemMap, {
      foreignKey: 'item_id',
      as: 'versionMaps'
    });
    this.hasMany(models.ChecklistItemCycleMap, {
      foreignKey: 'item_id',
      as: 'cycleMaps'
    });
  }
}

module.exports = ChecklistItemMasterNew;
