const { Model, DataTypes } = require('sequelize');

class User extends Model {
  static associate(models) {
    // 실제로 존재하는 모델과의 관계만 정의
    
    // DailyCheckItem 관계 (models/index.js에 등록됨)
    if (models.DailyCheckItem) {
      User.hasMany(models.DailyCheckItem, {
        foreignKey: 'confirmed_by',
        as: 'confirmedChecklists'
      });
    }
    
    // InspectionPhoto 관계 (models/index.js에 등록됨)
    if (models.InspectionPhoto) {
      User.hasMany(models.InspectionPhoto, {
        foreignKey: 'uploaded_by',
        as: 'uploadedPhotos'
      });
    }
    
    // Alert 관계 (models/index.js에 등록됨)
    if (models.Alert) {
      User.hasMany(models.Alert, {
        foreignKey: 'created_by',
        as: 'createdAlerts'
      });
    }
    
    // 향후 추가될 모델들을 위한 주석
    // Company, DailyCheck, Inspection, Repair, Transfer, Notification, GPSLocation, Shot
    // 이 모델들이 추가되면 아래 관계를 활성화하세요
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
