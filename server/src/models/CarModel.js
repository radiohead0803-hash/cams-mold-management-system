const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CarModel extends Model {
    static associate(models) {
      // 향후 금형이 차종을 참조하게 할 경우
      // CarModel.hasMany(models.Mold, { foreignKey: 'car_model_id', as: 'molds' });
    }
  }

  CarModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        comment: '차종 코드 (예: SP2, EV6)'
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '차종 명칭 (예: SP2(쏘울), EV6)'
      },
      oem: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '제조사 (HYUNDAI, KIA, GENESIS 등)'
      },
      segment: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '차급 (B-SUV, C-SUV, D-SEDAN 등)'
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '설명'
      },
      sort_order: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: '정렬 순서'
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: '활성화 여부'
      },
      created_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '생성자 ID'
      },
      updated_by: {
        type: DataTypes.INTEGER,
        allowNull: true,
        comment: '수정자 ID'
      }
    },
    {
      sequelize,
      modelName: 'CarModel',
      tableName: 'car_models',
      timestamps: true,
      underscored: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  );

  return CarModel;
};
