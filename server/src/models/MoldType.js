const { Model, DataTypes } = require('sequelize');

class MoldType extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        type_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },
        type_code: {
          type: DataTypes.STRING(50)
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
        modelName: 'MoldType',
        tableName: 'mold_types',
        timestamps: true,
        underscored: true
      }
    );
  }
}

module.exports = MoldType;
