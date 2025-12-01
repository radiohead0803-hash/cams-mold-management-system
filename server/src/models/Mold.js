const { Model, DataTypes } = require('sequelize');

class Mold extends Model {
  static associate(models) {
    // 실제로 존재하는 모델과의 관계만 정의
    
    // CarModel 관계 (차종)
    if (models.CarModel) {
      Mold.belongsTo(models.CarModel, {
        foreignKey: 'car_model_id',
        as: 'carModel'
      });
    }
    
    // DailyCheckItem 관계
    if (models.DailyCheckItem) {
      Mold.hasMany(models.DailyCheckItem, {
        foreignKey: 'mold_id',
        as: 'dailyCheckItems'
      });
    }
    
    // InspectionPhoto 관계
    if (models.InspectionPhoto) {
      Mold.hasMany(models.InspectionPhoto, {
        foreignKey: 'mold_id',
        as: 'photos'
      });
    }
    
    // MoldIssue 관계
    if (models.MoldIssue) {
      Mold.hasMany(models.MoldIssue, {
        foreignKey: 'mold_id',
        as: 'issues'
      });
    }
    
    // Alert 관계
    if (models.Alert) {
      Mold.hasMany(models.Alert, {
        foreignKey: 'mold_id',
        as: 'alerts'
      });
    }
    
    // MoldLocationLog 관계
    if (models.MoldLocationLog) {
      Mold.hasMany(models.MoldLocationLog, {
        foreignKey: 'mold_id',
        as: 'locationLogs'
      });
    }
    
    // 향후 추가될 모델들을 위한 주석
    // Company, DailyCheck, Inspection, Repair, Transfer, Notification, Shot
  }
}

module.exports = (sequelize) => {
  Mold.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mold_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true
    },
    mold_name: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    car_model: {
      type: DataTypes.STRING(100),
      comment: '차종 (레거시 문자열 필드, 향후 car_model_id 사용 권장)'
    },
    car_model_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'car_models',
        key: 'id'
      },
      comment: '차종 ID (car_models 테이블 FK)'
    },
    part_name: {
      type: DataTypes.STRING(200)
    },
    cavity: {
      type: DataTypes.INTEGER
    },
    plant_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '생산처 ID (초기 등록 시 null 가능)'
    },
    maker_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: '제작처 ID (초기 등록 시 null 가능)'
    },
    maker_company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    plant_company_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'companies',
        key: 'id'
      }
    },
    specification_id: {
      type: DataTypes.INTEGER,
      references: {
        model: 'mold_specifications',
        key: 'id'
      }
    },
    qr_token: {
      type: DataTypes.STRING(255),
      unique: true
    },
    sop_date: {
      type: DataTypes.DATEONLY
    },
    eop_date: {
      type: DataTypes.DATEONLY
    },
    target_shots: {
      type: DataTypes.INTEGER
    },
    current_shots: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      comment: 'active, repair, transfer, idle, scrapped'
    },
    location: {
      type: DataTypes.STRING(200)
    },
    last_gps_lat: {
      type: DataTypes.DECIMAL(10, 7),
      comment: '마지막 GPS 위도'
    },
    last_gps_lng: {
      type: DataTypes.DECIMAL(10, 7),
      comment: '마지막 GPS 경도'
    },
    last_gps_time: {
      type: DataTypes.DATE,
      comment: '마지막 GPS 업데이트 시간'
    },
    location_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'normal',
      comment: '현재 위치 상태 (normal/moved)'
    },
    base_gps_lat: {
      type: DataTypes.DECIMAL(10, 7),
      comment: '기준 GPS 위도 (등록된 위치)'
    },
    base_gps_lng: {
      type: DataTypes.DECIMAL(10, 7),
      comment: '기준 GPS 경도 (등록된 위치)'
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
    modelName: 'Mold',
    tableName: 'molds',
    timestamps: false,
    indexes: [
      { fields: ['plant_id'] },
      { fields: ['maker_id'] },
      { fields: ['specification_id'] },
      { fields: ['qr_token'] },
      { fields: ['status'] },
      { fields: ['car_model_id'] },
      { fields: ['location_status'] },
      { fields: ['last_gps_time'] }
    ]
  });

  return Mold;
};
