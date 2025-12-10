const { Model, DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  class RawMaterial extends Model {}

  RawMaterial.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      material_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '원재료명 (예: ABS, PP, PC 등)'
      },
      material_code: {
        type: DataTypes.STRING(50),
        comment: '원재료 코드'
      },
      material_grade: {
        type: DataTypes.STRING(100),
        comment: '원재료 등급/그레이드'
      },
      supplier: {
        type: DataTypes.STRING(200),
        comment: '공급업체'
      },
      category: {
        type: DataTypes.STRING(50),
        comment: '분류 (범용수지, 엔지니어링수지, 슈퍼엔지니어링수지 등)'
      },
      color: {
        type: DataTypes.STRING(50),
        comment: '색상'
      },
      shrinkage_rate: {
        type: DataTypes.DECIMAL(5, 3),
        comment: '수축률 (%)'
      },
      melt_temp_min: {
        type: DataTypes.INTEGER,
        comment: '용융온도 최소 (°C)'
      },
      melt_temp_max: {
        type: DataTypes.INTEGER,
        comment: '용융온도 최대 (°C)'
      },
      mold_temp_min: {
        type: DataTypes.INTEGER,
        comment: '금형온도 최소 (°C)'
      },
      mold_temp_max: {
        type: DataTypes.INTEGER,
        comment: '금형온도 최대 (°C)'
      },
      drying_temp: {
        type: DataTypes.INTEGER,
        comment: '건조온도 (°C)'
      },
      drying_time: {
        type: DataTypes.INTEGER,
        comment: '건조시간 (시간)'
      },
      density: {
        type: DataTypes.DECIMAL(5, 3),
        comment: '밀도 (g/cm³)'
      },
      mfi: {
        type: DataTypes.DECIMAL(6, 2),
        comment: 'MFI (Melt Flow Index)'
      },
      tensile_strength: {
        type: DataTypes.DECIMAL(6, 2),
        comment: '인장강도 (MPa)'
      },
      flexural_modulus: {
        type: DataTypes.DECIMAL(8, 2),
        comment: '굴곡탄성률 (MPa)'
      },
      impact_strength: {
        type: DataTypes.DECIMAL(6, 2),
        comment: '충격강도 (kJ/m²)'
      },
      hdt: {
        type: DataTypes.INTEGER,
        comment: '열변형온도 HDT (°C)'
      },
      description: {
        type: DataTypes.TEXT,
        comment: '설명/비고'
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
      modelName: 'RawMaterial',
      tableName: 'raw_materials',
      timestamps: true,
      underscored: true
    }
  );

  return RawMaterial;
};
