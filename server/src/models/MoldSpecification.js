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
        part_number: {
          type: DataTypes.STRING(50),
          allowNull: false
        },
        part_name: {
          type: DataTypes.STRING(200),
          allowNull: false
        },
        primary_part_name: {
          type: DataTypes.STRING(200),
          allowNull: true,
          comment: '대표품명'
        },
        car_model: {
          type: DataTypes.STRING(100)
        },
        car_year: {
          type: DataTypes.STRING(10)
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
