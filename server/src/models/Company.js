const { Model, DataTypes } = require('sequelize');

class Company extends Model {
  static associate(models) {
    // User 관계
    Company.hasMany(models.User, {
      foreignKey: 'company_id',
      as: 'users'
    });
    
    // Mold 관계 - 제작처
    Company.hasMany(models.Mold, {
      foreignKey: 'maker_company_id',
      as: 'makerMolds'
    });
    
    // Mold 관계 - 생산처
    Company.hasMany(models.Mold, {
      foreignKey: 'plant_company_id',
      as: 'plantMolds'
    });
    
    // MoldSpecification 관계 - 제작처
    Company.hasMany(models.MoldSpecification, {
      foreignKey: 'maker_company_id',
      as: 'makerSpecifications'
    });
    
    // MoldSpecification 관계 - 생산처
    Company.hasMany(models.MoldSpecification, {
      foreignKey: 'plant_company_id',
      as: 'plantSpecifications'
    });
  }
}

module.exports = (sequelize) => {
  Company.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    company_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: '회사 코드 (예: MKR-001, PLT-001)'
    },
    company_name: {
      type: DataTypes.STRING(200),
      allowNull: false,
      comment: '회사명'
    },
    company_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'maker: 금형제작처, plant: 생산처',
      validate: {
        isIn: [['maker', 'plant']]
      }
    },
    // 기본 정보
    business_number: {
      type: DataTypes.STRING(50),
      comment: '사업자등록번호'
    },
    representative: {
      type: DataTypes.STRING(100),
      comment: '대표자명'
    },
    // 연락처 정보
    phone: {
      type: DataTypes.STRING(20),
      comment: '전화번호'
    },
    fax: {
      type: DataTypes.STRING(20),
      comment: '팩스번호'
    },
    email: {
      type: DataTypes.STRING(100),
      comment: '이메일'
    },
    // 주소 정보
    address: {
      type: DataTypes.STRING(500),
      comment: '주소'
    },
    address_detail: {
      type: DataTypes.STRING(200),
      comment: '상세주소'
    },
    postal_code: {
      type: DataTypes.STRING(20),
      comment: '우편번호'
    },
    // GPS 위치
    latitude: {
      type: DataTypes.DECIMAL(10, 8),
      comment: '위도'
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8),
      comment: '경도'
    },
    // 담당자 정보
    manager_name: {
      type: DataTypes.STRING(100),
      comment: '담당자명'
    },
    manager_phone: {
      type: DataTypes.STRING(20),
      comment: '담당자 전화번호'
    },
    manager_email: {
      type: DataTypes.STRING(100),
      comment: '담당자 이메일'
    },
    // 계약 정보
    contract_start_date: {
      type: DataTypes.DATEONLY,
      comment: '계약 시작일'
    },
    contract_end_date: {
      type: DataTypes.DATEONLY,
      comment: '계약 종료일'
    },
    contract_status: {
      type: DataTypes.STRING(20),
      defaultValue: 'active',
      comment: 'active: 활성, expired: 만료, suspended: 중지',
      validate: {
        isIn: [['active', 'expired', 'suspended']]
      }
    },
    // 평가 정보
    rating: {
      type: DataTypes.DECIMAL(3, 2),
      comment: '평가 점수 (0.00 ~ 5.00)',
      validate: {
        min: 0,
        max: 5
      }
    },
    quality_score: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '품질 점수 (0 ~ 100)',
      validate: {
        min: 0,
        max: 100
      }
    },
    delivery_score: {
      type: DataTypes.DECIMAL(5, 2),
      comment: '납기 점수 (0 ~ 100)',
      validate: {
        min: 0,
        max: 100
      }
    },
    // 능력 정보 (제작처 전용)
    production_capacity: {
      type: DataTypes.INTEGER,
      comment: '생산 능력 (월간 금형 제작 수)'
    },
    equipment_list: {
      type: DataTypes.JSONB,
      comment: '보유 장비 목록'
    },
    certifications: {
      type: DataTypes.JSONB,
      comment: '인증 목록'
    },
    specialties: {
      type: DataTypes.JSONB,
      comment: '전문 분야'
    },
    // 생산 정보 (생산처 전용)
    production_lines: {
      type: DataTypes.INTEGER,
      comment: '생산 라인 수'
    },
    injection_machines: {
      type: DataTypes.JSONB,
      comment: '사출기 목록'
    },
    daily_capacity: {
      type: DataTypes.INTEGER,
      comment: '일일 생산 능력'
    },
    // 통계 정보
    total_molds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '총 금형 수'
    },
    active_molds: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '활성 금형 수'
    },
    completed_projects: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      comment: '완료된 프로젝트 수'
    },
    // 비고
    notes: {
      type: DataTypes.TEXT,
      comment: '비고'
    },
    // 상태
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      comment: '활성 상태'
    },
    // 등록 정보
    registered_by: {
      type: DataTypes.INTEGER,
      comment: '등록자 ID'
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
    modelName: 'Company',
    tableName: 'companies',
    timestamps: false,
    indexes: [
      { fields: ['company_code'] },
      { fields: ['company_type'] },
      { fields: ['company_name'] },
      { fields: ['is_active'] },
      { fields: ['contract_status'] }
    ]
  });

  return Company;
};
