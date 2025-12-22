const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class CarModel extends Model {
    static associate(models) {
      // Mold 관계 (차종에 속한 금형들)
      if (models.Mold) {
        CarModel.hasMany(models.Mold, {
          foreignKey: 'car_model_id',
          as: 'molds'
        });
      }
    }
  }

  CarModel.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      model_code: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '차종 코드 (예: OS, 5X, 3K, TH, EV)'
      },
      model_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '차종 명칭 (예: K5, EV6)'
      },
      project_name: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '프로젝트명 (예: DL3, KA4, NQ5, CV)'
      },
      manufacturer: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: '제조사 (현대, 기아 등)'
      },
      model_year: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: '년식 (예: 2024, 2023~2024)'
      },
      specification: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '사양 (예: 기본, 프리미엄, 스포츠)'
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
