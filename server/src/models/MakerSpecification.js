const { Model, DataTypes } = require('sequelize');

class MakerSpecification extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        specification_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'mold_specifications',
            key: 'id'
          }
        },
        maker_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        primary_part_number: {
          type: DataTypes.STRING(50),
          comment: '대표품번 (본사 연동)'
        },
        primary_part_name: {
          type: DataTypes.STRING(200),
          comment: '대표품명 (본사 연동)'
        },
        part_number: {
          type: DataTypes.STRING(50)
        },
        part_name: {
          type: DataTypes.STRING(200)
        },
        car_model: {
          type: DataTypes.STRING(100)
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
        development_stage: {
          type: DataTypes.STRING(20)
        },
        actual_material: {
          type: DataTypes.STRING(100)
        },
        actual_cavity_count: {
          type: DataTypes.INTEGER
        },
        core_material: {
          type: DataTypes.STRING(100)
        },
        cavity_material: {
          type: DataTypes.STRING(100)
        },
        hardness: {
          type: DataTypes.STRING(50)
        },
        cooling_type: {
          type: DataTypes.STRING(50)
        },
        ejection_type: {
          type: DataTypes.STRING(50)
        },
        hot_runner: {
          type: DataTypes.BOOLEAN
        },
        slide_count: {
          type: DataTypes.INTEGER
        },
        lifter_count: {
          type: DataTypes.INTEGER
        },
        cycle_time: {
          type: DataTypes.INTEGER
        },
        max_shots: {
          type: DataTypes.INTEGER
        },
        production_progress: {
          type: DataTypes.INTEGER
        },
        current_stage: {
          type: DataTypes.STRING(50)
        },
        completed: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        completed_date: {
          type: DataTypes.DATEONLY
        },
        status: {
          type: DataTypes.STRING(20)
        },
        synced_from_hq: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        synced_at: {
          type: DataTypes.DATE
        },
        notes: {
          type: DataTypes.TEXT
        },
        updated_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        }
      },
      {
        sequelize,
        modelName: 'MakerSpecification',
        tableName: 'maker_specifications',
        timestamps: true,
        underscored: true,
        indexes: [
          { fields: ['specification_id'] },
          { fields: ['maker_id'] },
          { fields: ['status'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.MoldSpecification, {
      foreignKey: 'specification_id',
      as: 'specification'
    });

    this.belongsTo(models.User, {
      foreignKey: 'maker_id',
      as: 'maker'
    });

    this.belongsTo(models.User, {
      foreignKey: 'updated_by',
      as: 'updater'
    });
  }
}

module.exports = MakerSpecification;
