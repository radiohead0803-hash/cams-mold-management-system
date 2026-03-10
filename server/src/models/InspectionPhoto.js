module.exports = (sequelize, DataTypes) => {
  const InspectionPhoto = sequelize.define('InspectionPhoto', {
    id: {
      type: DataTypes.UUID,
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4
    },
    mold_id: {
      type: DataTypes.INTEGER
    },
    checklist_id: {
      type: DataTypes.INTEGER
    },
    checklist_type: {
      type: DataTypes.STRING(100)
    },
    item_id: {
      type: DataTypes.INTEGER
    },
    item_status_id: {
      type: DataTypes.INTEGER
    },
    category: {
      type: DataTypes.STRING(100)
    },
    file_name: {
      type: DataTypes.STRING(500)
    },
    original_name: {
      type: DataTypes.STRING(500)
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    thumbnail_url: {
      type: DataTypes.STRING(500)
    },
    file_type: {
      type: DataTypes.STRING(50)
    },
    file_size: {
      type: DataTypes.INTEGER
    },
    mime_type: {
      type: DataTypes.STRING(100)
    },
    uploaded_by: {
      type: DataTypes.INTEGER
    },
    shot_count: {
      type: DataTypes.INTEGER
    },
    description: {
      type: DataTypes.TEXT
    },
    metadata: {
      type: DataTypes.JSONB
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    inspection_type: {
      type: DataTypes.STRING(50)
    },
    inspection_id: {
      type: DataTypes.INTEGER
    },
    // 마이그레이션 20260310 추가 컬럼
    source_page: {
      type: DataTypes.STRING(100)
    },
    capture_method: {
      type: DataTypes.STRING(20)
    },
    gps_latitude: {
      type: DataTypes.DOUBLE
    },
    gps_longitude: {
      type: DataTypes.DOUBLE
    },
    repair_request_id: {
      type: DataTypes.INTEGER
    },
    entity_type: {
      type: DataTypes.STRING(50)
    },
    entity_id: {
      type: DataTypes.INTEGER
    }
    // image_data (BYTEA)는 모델에서 제외 — raw query로만 처리
  }, {
    tableName: 'inspection_photos',
    timestamps: false,
    indexes: [
      { fields: ['mold_id'] },
      { fields: ['checklist_id'] },
      { fields: ['uploaded_at'] },
      { fields: ['inspection_type'] },
      { fields: ['item_id'] },
      { fields: ['source_page'] },
      { fields: ['entity_type', 'entity_id'] },
      { fields: ['repair_request_id'] }
    ]
  });

  InspectionPhoto.associate = (models) => {
    if (models.Mold) {
      InspectionPhoto.belongsTo(models.Mold, {
        foreignKey: 'mold_id',
        as: 'mold'
      });
    }
    
    if (models.DailyCheckItem) {
      InspectionPhoto.belongsTo(models.DailyCheckItem, {
        foreignKey: 'checklist_id',
        as: 'checklist'
      });
    }
    
    if (models.User) {
      InspectionPhoto.belongsTo(models.User, {
        foreignKey: 'uploaded_by',
        as: 'uploader'
      });
    }
  };

  return InspectionPhoto;
};
