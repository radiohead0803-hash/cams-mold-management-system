const { Model, DataTypes } = require('sequelize');

class CheckItemMaster extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        category: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        item_name: {
          type: DataTypes.STRING(100),
          allowNull: false
        },
        item_description: {
          type: DataTypes.TEXT
        },
        check_points: {
          type: DataTypes.JSONB,
          comment: '점검 포인트 배열'
        },
        guide_photos: {
          type: DataTypes.JSONB,
          comment: '가이드 사진'
        },
        guide_documents: {
          type: DataTypes.JSONB,
          comment: '가이드 문서'
        },
        guide_video_url: {
          type: DataTypes.STRING(500)
        },
        is_required: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        display_order: {
          type: DataTypes.INTEGER
        },
        active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        }
      },
      {
        sequelize,
        modelName: 'CheckItemMaster',
        tableName: 'check_item_master',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['category'] },
          { fields: ['active'] }
        ]
      }
    );
  }

  static associate(models) {
    this.hasMany(models.DailyCheckItem, {
      foreignKey: 'item_master_id',
      as: 'checkItems'
    });

    this.hasMany(models.CheckGuideMaterial, {
      foreignKey: 'item_master_id',
      as: 'guideMaterials'
    });
  }
}

module.exports = CheckItemMaster;
