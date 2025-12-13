const { Model, DataTypes } = require('sequelize');

class MoldSpecification extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        primary_part_number: {
          type: DataTypes.STRING(50),
          allowNull: true,
          comment: '대표품번'
        },
        primary_part_name: {
          type: DataTypes.STRING(200),
          allowNull: true,
          comment: '대표품명'
        },
        part_number: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        part_name: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        car_model_id: {
          type: DataTypes.INTEGER,
          comment: '차종 ID (car_models 테이블 연동)'
        },
        car_model: {
          type: DataTypes.STRING(100),
          comment: '차종명'
        },
        car_specification: {
          type: DataTypes.STRING(100),
          comment: '사양 (기초정보 연동)'
        },
        car_year: {
          type: DataTypes.STRING(20),
          comment: '년식 (기초정보 연동)'
        },
        raw_material_id: {
          type: DataTypes.INTEGER,
          comment: '원재료 ID (raw_materials 테이블 연동)'
        },
        ms_spec: {
          type: DataTypes.STRING(100),
          comment: 'MS 스펙 (기초정보 연동)'
        },
        material_type: {
          type: DataTypes.STRING(200),
          comment: '타입 (기초정보 연동)'
        },
        grade: {
          type: DataTypes.STRING(100),
          comment: '그레이드 (기초정보 연동)'
        },
        shrinkage_rate: {
          type: DataTypes.STRING(50),
          comment: '수축율 (기초정보 연동)'
        },
        supplier: {
          type: DataTypes.STRING(200),
          comment: '공급업체 (기초정보 연동)'
        },
        mold_type: {
          type: DataTypes.STRING(50)
        },
        cavity_count: {
          type: DataTypes.INTEGER
        },
        material: {
          type: DataTypes.STRING(100)
        },
        tonnage: {
          type: DataTypes.INTEGER
        },
        dimensions: {
          type: DataTypes.STRING(100),
          comment: '치수 (LxWxH mm)'
        },
        weight: {
          type: DataTypes.DECIMAL(10, 2),
          comment: '중량 (kg)'
        },
        manager_name: {
          type: DataTypes.STRING(100),
          comment: '담당자명'
        },
        cycle_time: {
          type: DataTypes.INTEGER,
          comment: '사이클 타임 (초)'
        },
        injection_temp: {
          type: DataTypes.INTEGER,
          comment: '사출 온도 (°C)'
        },
        injection_pressure: {
          type: DataTypes.INTEGER,
          comment: '사출 압력 (bar)'
        },
        injection_speed: {
          type: DataTypes.INTEGER,
          comment: '사출 속도 (mm/s)'
        },
        target_maker_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'companies',
            key: 'id'
          },
          comment: '제작처 회사 ID (maker_company_id와 동일)'
        },
        development_stage: {
          type: DataTypes.STRING(20),
          comment: '개발, 양산'
        },
        production_stage: {
          type: DataTypes.STRING(20)
        },
        order_date: {
          type: DataTypes.DATEONLY
        },
        target_delivery_date: {
          type: DataTypes.DATEONLY
        },
        estimated_cost: {
          type: DataTypes.DECIMAL(12, 2),
          comment: '예상 비용 (기존 호환용)'
        },
        icms_cost: {
          type: DataTypes.DECIMAL(12, 2),
          comment: 'ICMS 비용 (원)'
        },
        vendor_quote_cost: {
          type: DataTypes.DECIMAL(12, 2),
          comment: '업체 견적가 (원)'
        },
        maker_estimated_cost: {
          type: DataTypes.DECIMAL(12, 2),
          comment: '업체 견적가 (원) - vendor_quote_cost와 동일'
        },
        mold_spec_type: {
          type: DataTypes.STRING(50),
          defaultValue: '시작금형',
          comment: '제작사양: 시작금형, 양산금형'
        },
        target_plant_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'companies',
            key: 'id'
          },
          comment: '목표 생산처 회사 ID'
        },
        drawing_review_date: {
          type: DataTypes.DATEONLY,
          comment: '도면검토회 일정'
        },
        actual_delivery_date: {
          type: DataTypes.DATEONLY,
          comment: '실제 납기일'
        },
        actual_cost: {
          type: DataTypes.DECIMAL(12, 2),
          comment: '실제 비용'
        },
        status: {
          type: DataTypes.STRING(20),
          comment: 'draft, sent_to_maker, in_production, completed'
        },
        created_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        notes: {
          type: DataTypes.TEXT,
          comment: '비고'
        },
        maker_company_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'companies',
            key: 'id'
          },
          comment: '제작처 회사 ID'
        },
        plant_company_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'companies',
            key: 'id'
          },
          comment: '생산처 회사 ID'
        },
        mold_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'molds',
            key: 'id'
          },
          comment: '연동된 금형 마스터 ID'
        },
        part_images: {
          type: DataTypes.JSONB,
          allowNull: true,
          defaultValue: null,
          comment: '부품 사진 URL 배열 - [{"url": "...", "filename": "...", "uploaded_at": "..."}]'
        }
      },
      {
        sequelize,
        modelName: 'MoldSpecification',
        tableName: 'mold_specifications',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['part_number'] },
          { fields: ['target_maker_id'] },
          { fields: ['status'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Company, {
      foreignKey: 'target_maker_id',
      as: 'targetMaker'
    });

    this.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    this.belongsTo(models.Company, {
      foreignKey: 'maker_company_id',
      as: 'makerCompany'
    });

    this.belongsTo(models.Company, {
      foreignKey: 'plant_company_id',
      as: 'plantCompany'
    });

    this.hasOne(models.MakerSpecification, {
      foreignKey: 'specification_id',
      as: 'makerSpecification'
    });

    this.hasOne(models.Mold, {
      foreignKey: 'specification_id',
      as: 'mold'
    });
  }
}

module.exports = MoldSpecification;
