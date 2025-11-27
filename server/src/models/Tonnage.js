const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class Tonnage extends Model {}

  Tonnage.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tonnage_value: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true
      },
      description: {
        type: DataTypes.TEXT
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'Tonnage',
      tableName: 'tonnages',
      timestamps: true,
      underscored: true
    }
  );

  return Tonnage;
};
