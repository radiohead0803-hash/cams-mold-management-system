const { Model, DataTypes } = require('sequelize');

class CheckGuideMaterial extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        item_master_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'check_item_master',
            key: 'id'
          }
        },
        material_type: {
          type: DataTypes.STRING(20),
          comment: 'photo, document, video'
        },
        title: {
          type: DataTypes.STRING(200)
        },
        description: {
          type: DataTypes.TEXT
        },
        file_url: {
          type: DataTypes.STRING(500)
        },
        file_size: {
          type: DataTypes.INTEGER
        },
        mime_type: {
          type: DataTypes.STRING(100)
        },
        thumbnail_url: {
          type: DataTypes.STRING(500)
        },
        display_order: {
          type: DataTypes.INTEGER
        },
        active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        created_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'CheckGuideMaterial',
        tableName: 'check_guide_materials',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['item_master_id'] },
          { fields: ['material_type'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.CheckItemMaster, {
      foreignKey: 'item_master_id',
      as: 'itemMaster'
    });

    this.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });
  }
}

module.exports = CheckGuideMaterial;
