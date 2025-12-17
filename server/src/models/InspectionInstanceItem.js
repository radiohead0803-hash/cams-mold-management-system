const { Model, DataTypes } = require('sequelize');

/**
 * 점검 실행 상세 (항목별 결과)
 */
class InspectionInstanceItem extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        inspection_instance_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'inspection_instances',
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
        result: {
          type: DataTypes.ENUM('good', 'caution', 'bad', 'na'),
          comment: '양호/주의/불량/해당없음'
        },
        note: {
          type: DataTypes.TEXT,
          comment: '비고'
        },
        photo_urls: {
          type: DataTypes.JSONB,
          defaultValue: [],
          comment: '다중 사진 URL'
        }
      },
      {
        sequelize,
        modelName: 'InspectionInstanceItem',
        tableName: 'inspection_instance_items',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['inspection_instance_id'] },
          { fields: ['item_id'] },
          { fields: ['result'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.InspectionInstanceNew, {
      foreignKey: 'inspection_instance_id',
      as: 'instance'
    });
    this.belongsTo(models.ChecklistItemMasterNew, {
      foreignKey: 'item_id',
      as: 'item'
    });
  }
}

module.exports = InspectionInstanceItem;
