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
      type: DataTypes.INTEGER,
      allowNull: false
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
    }
  }, {
    tableName: 'inspection_photos',
    timestamps: false,
    indexes: [
      { fields: ['mold_id'] },
      { fields: ['checklist_id'] },
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
    
    if (models.User) {
      InspectionPhoto.belongsTo(models.User, {
        foreignKey: 'uploaded_by',
        as: 'uploader'
      });
    }
  };

  return InspectionPhoto;
};
