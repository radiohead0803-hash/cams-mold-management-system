const { Model, DataTypes } = require('sequelize');

class Material extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        material_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          unique: true
        },
        material_code: {
          type: DataTypes.STRING(50)
        },
        category: {
          type: DataTypes.STRING(50)
        },
        hardness: {
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
        modelName: 'Material',
        tableName: 'materials',
        timestamps: true,
        underscored: true
      }
    );
  }
}

module.exports = Material;
