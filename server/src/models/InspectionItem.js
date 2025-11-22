const { Model, DataTypes } = require('sequelize');

class InspectionItem extends Model {
  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        inspection_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'inspections',
            key: 'id'
          }
        },
        category: {
          type: DataTypes.STRING(50)
        },
        item_name: {
          type: DataTypes.STRING(100)
        },
        item_description: {
          type: DataTypes.TEXT
        },
        status: {
          type: DataTypes.STRING(20),
          comment: '양호, 정비 필요, 수리 필요'
        },
        notes: {
          type: DataTypes.TEXT
        },
        photos: {
          type: DataTypes.JSONB
        },
        is_required: {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        },
        display_order: {
          type: DataTypes.INTEGER
        }
      },
      {
        sequelize,
        modelName: 'InspectionItem',
        tableName: 'inspection_items',
        timestamps: false,
        createdAt: 'created_at',
        updatedAt: false,
        underscored: true,
        indexes: [
          { fields: ['inspection_id'] }
        ]
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.Inspection, {
      foreignKey: 'inspection_id',
      as: 'inspection'
    });
  }
}

module.exports = InspectionItem;
