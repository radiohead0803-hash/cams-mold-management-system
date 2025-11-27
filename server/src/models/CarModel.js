const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CarModel extends Model {}

  CarModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      model_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
      },
      model_code: {
        type: DataTypes.STRING(50)
      },
      manufacturer: {
        type: DataTypes.STRING(100)
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
      modelName: 'CarModel',
      tableName: 'car_models',
      timestamps: true,
      underscored: true
    }
  );

  return CarModel;
};
