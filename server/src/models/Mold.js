const { Model, DataTypes } = require('sequelize');

class Mold extends Model {
  static associate(models) {
    // Company 관계 - 제작처
    Mold.belongsTo(models.Company, {
      foreignKey: 'maker_company_id',
      as: 'makerCompany'
    });
    
    // Company 관계 - 생산처
    Mold.belongsTo(models.Company, {
      foreignKey: 'plant_company_id',
      as: 'plantCompany'
    });
    
    // Specification 관계
    Mold.belongsTo(models.MoldSpecification, {
      foreignKey: 'specification_id',
      as: 'specification'
    });
    
    // Daily Check 관계
    Mold.hasMany(models.DailyCheck, {
      foreignKey: 'mold_id',
      as: 'dailyChecks'
    });
    
    Mold.hasMany(models.DailyCheckItem, {
      foreignKey: 'mold_id',
      as: 'dailyCheckItems'
    });
    
    // Inspection 관계
    Mold.hasMany(models.Inspection, {
      foreignKey: 'mold_id',
      as: 'inspections'
    });
    
    Mold.hasMany(models.InspectionPhoto, {
      foreignKey: 'mold_id',
      as: 'photos'
    });
    
    // Repair 관계
    Mold.hasMany(models.Repair, {
      foreignKey: 'mold_id',
      as: 'repairs'
    });
    
    // Transfer 관계
    Mold.hasMany(models.Transfer, {
      foreignKey: 'mold_id',
      as: 'transfers'
    });
    
    // Notification 관계
    Mold.hasMany(models.Notification, {
      foreignKey: 'mold_id',
      as: 'notifications'
    });
    
    // Shot 관계
    Mold.hasMany(models.Shot, {
      foreignKey: 'mold_id',
      as: 'shots'
    });
    
    // GPS Location 관계
    Mold.hasMany(models.GPSLocation, {
      foreignKey: 'mold_id',
      as: 'gpsLocations'
    });
    
    // Mold Issue 관계
    Mold.hasMany(models.MoldIssue, {
      foreignKey: 'mold_id',
      as: 'issues'
    });
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
      type: DataTypes.STRING(100)
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
      { fields: ['status'] }
    ]
  });

  return Mold;
};
