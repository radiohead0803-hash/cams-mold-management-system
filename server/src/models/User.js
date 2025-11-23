const { Model, DataTypes } = require('sequelize');

class User extends Model {
  static associate(models) {
    // Company 관계
    User.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'company'
    });
    
    // Daily Check 관계
    User.hasMany(models.DailyCheck, {
      foreignKey: 'inspector_id',
      as: 'dailyChecks'
    });
    
    User.hasMany(models.DailyCheckItem, {
      foreignKey: 'confirmed_by',
      as: 'confirmedChecklists'
    });
    
    // Inspection 관계
    User.hasMany(models.Inspection, {
      foreignKey: 'inspector_id',
      as: 'inspections'
    });
    
    User.hasMany(models.InspectionPhoto, {
      foreignKey: 'uploaded_by',
      as: 'uploadedPhotos'
    });
    
    // Repair 관계
    User.hasMany(models.Repair, {
      foreignKey: 'requested_by',
      as: 'repairRequests'
    });
    
    // Transfer 관계
    User.hasMany(models.Transfer, {
      foreignKey: 'requested_by',
      as: 'transferRequests'
    });
    
    // Notification 관계
    User.hasMany(models.Notification, {
      foreignKey: 'user_id',
      as: 'notifications'
    });
    
    // GPS Location 관계
    User.hasMany(models.GPSLocation, {
      foreignKey: 'recorded_by',
      as: 'gpsRecords'
    });
    
    // Shot 관계
    User.hasMany(models.Shot, {
      foreignKey: 'recorded_by',
      as: 'shotRecords'
    });
  }
}

module.exports = (sequelize) => {
  User.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(100),
      unique: true
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    // 사용자 유형 (4가지)
    user_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'system_admin, mold_developer, maker, plant'
    },
    company_id: {
      type: DataTypes.INTEGER
    },
    company_name: {
      type: DataTypes.STRING(100)
    },
    company_type: {
      type: DataTypes.STRING(20),
      comment: 'hq, maker, plant'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    failed_login_attempts: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    locked_until: {
      type: DataTypes.DATE
    },
    last_login_at: {
      type: DataTypes.DATE
    },
    last_login_ip: {
      type: DataTypes.STRING(45)
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    sequelize,
    modelName: 'User',
    tableName: 'users',
    timestamps: false,
    indexes: [
      { fields: ['username'] },
      { fields: ['email'] },
      { fields: ['user_type'] },
      { fields: ['company_id'] },
      { fields: ['company_type'] }
    ]
  });

  return User;
};
