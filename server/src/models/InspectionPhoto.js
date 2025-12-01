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
    item_status_id: {
      type: DataTypes.INTEGER
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    thumbnail_url: {
      type: DataTypes.STRING(500)
    },
    file_type: {
      type: DataTypes.STRING(50),
      comment: 'image/jpeg, image/png, application/pdf, etc.'
    },
    file_size: {
      type: DataTypes.INTEGER,
      comment: 'File size in bytes'
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    shot_count: {
      type: DataTypes.INTEGER
    },
    metadata: {
      type: DataTypes.JSONB,
      comment: 'Additional metadata like camera info, location, etc.'
    },
    uploaded_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'inspection_photos',
    timestamps: false,
    indexes: [
      { fields: ['mold_id'] },
      { fields: ['checklist_id'] },
      { fields: ['item_status_id'] },
      { fields: ['uploaded_at'] }
    ]
  });

  InspectionPhoto.associate = (models) => {
    // 실제로 존재하는 모델과의 관계만 정의
    
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
    
    if (models.DailyCheckItemStatus) {
      InspectionPhoto.belongsTo(models.DailyCheckItemStatus, {
        foreignKey: 'item_status_id',
        as: 'itemStatus'
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
