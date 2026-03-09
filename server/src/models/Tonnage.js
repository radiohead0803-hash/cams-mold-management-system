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
        allowNull: false
      },
      manufacturer: {
        type: DataTypes.STRING(100),
        comment: '제조처 (LS엠트론, 우진플라임 등)'
      },
      model_name: {
        type: DataTypes.STRING(100),
        comment: '모델명 (예: LGE350)'
      },
      clamping_force: {
        type: DataTypes.INTEGER,
        comment: '형체력(ton)'
      },
      clamping_stroke: {
        type: DataTypes.INTEGER,
        comment: '형개폐 스트로크(mm)'
      },
      daylight_opening: {
        type: DataTypes.INTEGER,
        comment: '데이라이트(mm)'
      },
      platen_size_h: {
        type: DataTypes.INTEGER,
        comment: '플래튼 가로(mm)'
      },
      platen_size_v: {
        type: DataTypes.INTEGER,
        comment: '플래튼 세로(mm)'
      },
      tiebar_spacing_h: {
        type: DataTypes.INTEGER,
        comment: '타이바 간격 가로(mm)'
      },
      tiebar_spacing_v: {
        type: DataTypes.INTEGER,
        comment: '타이바 간격 세로(mm)'
      },
      min_mold_thickness: {
        type: DataTypes.INTEGER,
        comment: '최소 금형두께(mm)'
      },
      max_mold_thickness: {
        type: DataTypes.INTEGER,
        comment: '최대 금형두께(mm)'
      },
      max_mold_width: {
        type: DataTypes.INTEGER,
        comment: '최대 금형 가로(mm)'
      },
      max_mold_height: {
        type: DataTypes.INTEGER,
        comment: '최대 금형 세로(mm)'
      },
      ejector_force: {
        type: DataTypes.INTEGER,
        comment: '이젝터력(kN)'
      },
      ejector_stroke: {
        type: DataTypes.INTEGER,
        comment: '이젝터 스트로크(mm)'
      },
      screw_diameter: {
        type: DataTypes.INTEGER,
        comment: '스크류 직경(mm)'
      },
      shot_volume: {
        type: DataTypes.INTEGER,
        comment: '사출용량(cm³)'
      },
      shot_weight: {
        type: DataTypes.INTEGER,
        comment: '사출중량 PS기준(g)'
      },
      injection_pressure: {
        type: DataTypes.INTEGER,
        comment: '사출압력(kgf/cm²)'
      },
      injection_rate: {
        type: DataTypes.INTEGER,
        comment: '사출속도(cm³/s)'
      },
      plasticizing_capacity: {
        type: DataTypes.INTEGER,
        comment: '가소화능력(kg/h)'
      },
      nozzle_contact_force: {
        type: DataTypes.INTEGER,
        comment: '노즐접촉력(kN)'
      },
      machine_dimensions: {
        type: DataTypes.STRING(100),
        comment: '기계 치수(LxWxH mm)'
      },
      machine_weight: {
        type: DataTypes.INTEGER,
        comment: '기계 중량(kg)'
      },
      motor_power: {
        type: DataTypes.INTEGER,
        comment: '모터출력(kW)'
      },
      description: {
        type: DataTypes.TEXT
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
      },
      is_new: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: '자동 수집으로 신규 추가된 항목'
      },
      source: {
        type: DataTypes.STRING(50),
        comment: '데이터 출처 (manual, auto_sync)'
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
