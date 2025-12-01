module.exports = (sequelize, DataTypes) => {
  const MoldLocationLog = sequelize.define('MoldLocationLog', {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    mold_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      field: 'mold_id'
    },
    plant_id: {
      type: DataTypes.BIGINT,
      field: 'plant_id'
    },
    scanned_by_id: {
      type: DataTypes.BIGINT,
      field: 'scanned_by_id'
    },
    scanned_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'scanned_at'
    },
    gps_lat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      field: 'gps_lat'
    },
    gps_lng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: false,
      field: 'gps_lng'
    },
    distance_m: {
      type: DataTypes.INTEGER,
      field: 'distance_m',
      comment: '기준점과의 거리(미터)'
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'normal',
      validate: {
        isIn: [['normal', 'moved', 'unknown']]
      },
      comment: 'normal: 정상, moved: 위치이탈, unknown: 미확인'
    },
    source: {
      type: DataTypes.STRING(20),
      defaultValue: 'qr_scan',
      comment: 'qr_scan: QR스캔, manual: 수동입력, auto: 자동'
    },
    notes: {
      type: DataTypes.TEXT
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
      field: 'created_at'
    }
  }, {
    tableName: 'mold_location_logs',
    timestamps: false,
    indexes: [
      { fields: ['mold_id'] },
      { fields: ['scanned_at'] },
      { fields: ['status'] },
      { fields: ['plant_id'] }
    ]
  });

  MoldLocationLog.associate = (models) => {
    if (models.Mold) {
      MoldLocationLog.belongsTo(models.Mold, {
        foreignKey: 'mold_id',
        as: 'mold'
      });
    }
    
    if (models.Plant) {
      MoldLocationLog.belongsTo(models.Plant, {
        foreignKey: 'plant_id',
        as: 'plant'
      });
    }
    
    if (models.User) {
      MoldLocationLog.belongsTo(models.User, {
        foreignKey: 'scanned_by_id',
        as: 'scannedBy'
      });
    }
  };

  return MoldLocationLog;
};
