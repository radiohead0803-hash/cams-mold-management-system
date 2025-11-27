const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class DailyCheckItem extends Model {
    static associate(models) {
      DailyCheckItem.belongsTo(models.DailyCheck, {
        foreignKey: 'check_id',
        as: 'check'
      });

      DailyCheckItem.belongsTo(models.CheckItemMaster, {
        foreignKey: 'item_master_id',
        as: 'itemMaster'
      });
    }
  }

  DailyCheckItem.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      check_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'daily_checks',
          key: 'id'
        }
      },
      item_master_id: {
        type: DataTypes.INTEGER,
        references: {
          model: 'check_item_master',
          key: 'id'
        }
      },
      category: {
        type: DataTypes.STRING(50)
      },
      item_name: {
        type: DataTypes.STRING(100)
      },
      item_description: {
        type: DataTypes.TEXT
      },
      status: {
        type: DataTypes.STRING(20),
        comment: '양호, 주의, 불량'
      },
      notes: {
        type: DataTypes.TEXT
      },
      photos: {
        type: DataTypes.JSONB,
        comment: '사진 [{url, caption, uploaded_at}]'
      },
      is_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      display_order: {
        type: DataTypes.INTEGER
      }
    },
    {
      sequelize,
      modelName: 'DailyCheckItem',
      tableName: 'daily_check_items',
      timestamps: false,
      createdAt: 'created_at',
      updatedAt: false,
      underscored: true,
      indexes: [
        { fields: ['check_id'] },
        { fields: ['item_master_id'] }
      ]
    }
  );

  return DailyCheckItem;
};
