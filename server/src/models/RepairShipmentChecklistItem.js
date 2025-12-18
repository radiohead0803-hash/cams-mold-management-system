/**
 * 금형 수리 후 출하단계 점검 체크리스트 항목 모델
 * - 8개 카테고리, 40+ 점검 항목
 */
module.exports = (sequelize, DataTypes) => {
  const RepairShipmentChecklistItem = sequelize.define(
    'RepairShipmentChecklistItem',
    {
      checklist_id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        comment: '체크리스트 ID'
      },
      // 카테고리 정보
      category_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '카테고리 코드 (repair_history, surface, function, dimension, cooling, trial, shipment, final)'
      },
      category_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: '카테고리명'
      },
      category_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '카테고리 순서'
      },
      // 항목 정보
      item_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        comment: '항목 코드 (1-1, 1-2, ...)'
      },
      item_name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: '점검 항목명'
      },
      item_description: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '점검 내용/기준'
      },
      item_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        comment: '항목 순서'
      },
      // 점검 결과
      result: {
        type: DataTypes.STRING(20),
        allowNull: true,
        comment: 'pass | fail | na | pending'
      },
      // 사진 필수 여부 (전체 항목 사진 필수)
      photo_required: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        comment: '사진 첨부 필수 여부 (전체 항목 필수)'
      },
      // 첨부 사진 URL들
      photo_urls: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: '첨부 사진 URL 배열'
      },
      // Before/After 사진 (수리 전후 비교)
      before_photo_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '수리 전 사진'
      },
      after_photo_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
        comment: '수리 후 사진'
      },
      // 비고/메모
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '비고'
      },
      // 불합격 사유
      fail_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: '불합격 사유'
      },
      // 점검자 정보
      checked_by: {
        type: DataTypes.BIGINT,
        allowNull: true,
        comment: '점검자 ID'
      },
      checked_by_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: '점검자명'
      },
      checked_at: {
        type: DataTypes.DATE,
        allowNull: true,
        comment: '점검 시간'
      },
      // 메타데이터
      metadata: {
        type: DataTypes.JSONB,
        allowNull: true,
        comment: '추가 메타데이터 (Shim 변경 정보 등)'
      }
    },
    {
      tableName: 'repair_shipment_checklist_items',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      indexes: [
        { fields: ['checklist_id'] },
        { fields: ['category_code'] },
        { fields: ['result'] }
      ]
    }
  );

  RepairShipmentChecklistItem.associate = (models) => {
    if (models.RepairShipmentChecklist) {
      RepairShipmentChecklistItem.belongsTo(models.RepairShipmentChecklist, {
        foreignKey: 'checklist_id',
        as: 'checklist'
      });
    }
  };

  return RepairShipmentChecklistItem;
};
