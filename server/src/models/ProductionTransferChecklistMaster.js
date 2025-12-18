const { Model, DataTypes } = require('sequelize');

class ProductionTransferChecklistMaster extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        category: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: '카테고리 (금형상태, 서류, 시운전결과 등)'
        },
        item_code: {
          type: DataTypes.STRING(50),
          allowNull: false,
          comment: '항목 코드'
        },
        item_name: {
          type: DataTypes.STRING(200),
          allowNull: false,
          comment: '항목명'
        },
        description: {
          type: DataTypes.TEXT,
          comment: '상세 설명'
        },
        is_required: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          comment: '필수 여부'
        },
        requires_attachment: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '첨부파일 필요 여부'
        },
        attachment_type: {
          type: DataTypes.STRING(50),
          comment: '첨부파일 유형 (image, document)'
        },
        display_order: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: '표시 순서'
        },
        guide_description: {
          type: DataTypes.TEXT,
          comment: '가이드 상세 설명'
        },
        check_points: {
          type: DataTypes.ARRAY(DataTypes.TEXT),
          comment: '점검 포인트 목록'
        },
        guide_video_url: {
          type: DataTypes.STRING(500),
          comment: '가이드 동영상 URL'
        },
        guide_image_url: {
          type: DataTypes.STRING(500),
          comment: '가이드 이미지 URL'
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          comment: '활성화 여부'
        },
        created_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'ProductionTransferChecklistMaster',
        tableName: 'production_transfer_checklist_master',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['category'] },
          { fields: ['is_active'] },
          { fields: ['display_order'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    this.hasMany(models.ProductionTransferChecklistItem, {
      foreignKey: 'master_item_id',
      as: 'checklistItems'
    });
  }
}

module.exports = ProductionTransferChecklistMaster;
