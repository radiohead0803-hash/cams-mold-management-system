const { Model, DataTypes } = require('sequelize');

/**
 * 표준문서 마스터 템플릿
 * - 제작전 체크리스트, 일상점검, 정기점검, 금형체크리스트, 개발계획, 이관, 경도측정, 금형육성 등
 * - Draft → Approved → Deployed 상태 흐름
 */
class StandardDocumentTemplate extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        template_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          unique: true,
          comment: '템플릿 코드 (유니크)'
        },
        template_name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: '표준문서명'
        },
        template_type: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: 'pre_production, daily_check, periodic_check, mold_checklist, development_plan, transfer, hardness, nurturing'
        },
        version: {
          type: DataTypes.STRING(20),
          defaultValue: '1.0'
        },
        status: {
          type: DataTypes.STRING(30),
          defaultValue: 'draft',
          comment: 'draft, pending, approved, deployed, rejected, archived'
        },
        description: {
          type: DataTypes.TEXT
        },
        development_stage: {
          type: DataTypes.STRING(20),
          defaultValue: 'all',
          comment: 'all, development, production'
        },
        deployed_to: {
          type: DataTypes.JSONB,
          defaultValue: []
        },
        item_count: {
          type: DataTypes.INTEGER,
          defaultValue: 0
        },
        category_count: {
          type: DataTypes.INTEGER,
          defaultValue: 1
        },
        template_data: {
          type: DataTypes.JSONB,
          defaultValue: {}
        },
        items: {
          type: DataTypes.JSONB,
          defaultValue: []
        },
        stages: {
          type: DataTypes.JSONB,
          defaultValue: []
        },
        created_by: {
          type: DataTypes.INTEGER
        },
        created_by_name: {
          type: DataTypes.STRING(100)
        },
        approved_by: {
          type: DataTypes.INTEGER
        },
        approved_by_name: {
          type: DataTypes.STRING(100)
        },
        approved_at: {
          type: DataTypes.DATE
        },
        deployed_by: {
          type: DataTypes.INTEGER
        },
        deployed_by_name: {
          type: DataTypes.STRING(100)
        },
        deployed_at: {
          type: DataTypes.DATE
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        }
      },
      {
        sequelize,
        modelName: 'StandardDocumentTemplate',
        tableName: 'standard_document_templates',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['template_type'] },
          { fields: ['status'] },
          { fields: ['development_stage'] },
          { fields: ['is_active'] }
        ]
      }
    );
  }
}

module.exports = StandardDocumentTemplate;
