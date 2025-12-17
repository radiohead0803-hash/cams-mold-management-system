/**
 * 시스템 규칙/기준값 모델
 * 점검 주기, 타수 기준, GPS 이탈 반경 등 운영 기준값 관리
 */
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SystemRule = sequelize.define('SystemRule', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    // 규칙 키 (고유 식별자)
    rule_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },
    // 규칙 카테고리
    category: {
      type: DataTypes.ENUM(
        'inspection',      // 점검 관련
        'shot_count',      // 타수 관련
        'gps',             // GPS 관련
        'notification',    // 알림 관련
        'approval',        // 승인 관련
        'system'           // 시스템 설정
      ),
      allowNull: false
    },
    // 규칙 이름 (표시용)
    name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    // 규칙 설명
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    // 값 (문자열로 저장, 타입에 따라 변환)
    value: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    // 값 타입
    value_type: {
      type: DataTypes.ENUM('number', 'string', 'boolean', 'json'),
      defaultValue: 'number'
    },
    // 단위 (일, 시간, km, 회 등)
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    // 최소값 (숫자 타입인 경우)
    min_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    // 최대값 (숫자 타입인 경우)
    max_value: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true
    },
    // 기본값
    default_value: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    // 적용 대상 (all, maker, plant 등)
    applies_to: {
      type: DataTypes.STRING(100),
      defaultValue: 'all'
    },
    // 활성화 여부
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // 수정 가능 여부
    is_editable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    // 마지막 수정자 ID
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    // 마지막 수정자 이름
    updated_by_name: {
      type: DataTypes.STRING(100),
      allowNull: true
    }
  }, {
    tableName: 'system_rules',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    indexes: [
      { fields: ['rule_key'], unique: true },
      { fields: ['category'] },
      { fields: ['is_active'] }
    ]
  });

  return SystemRule;
};
