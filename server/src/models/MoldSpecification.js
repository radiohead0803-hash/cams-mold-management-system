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
            model: 'users',
            key: 'id'
          }
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
        actual_delivery_date: {
          type: DataTypes.DATEONLY
        },
        estimated_cost: {
          type: DataTypes.DECIMAL(12, 2)
        },
        actual_cost: {
          type: DataTypes.DECIMAL(12, 2)
        },
        status: {
          type: DataTypes.STRING(20),
          comment: 'draft, sent_to_maker, in_production, completed'
        },
        external_system_id: {
          type: DataTypes.STRING(100),
          comment: '부품정보 시스템 ID'
        },
        external_sync_enabled: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        last_sync_date: {
          type: DataTypes.DATE
        },
        mold_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'molds',
            key: 'id'
          }
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
          { fields: ['mold_id'] },
          { fields: ['target_maker_id'] },
          { fields: ['status'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });

    this.belongsTo(models.User, {
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
  }
}

module.exports = MoldSpecification;
