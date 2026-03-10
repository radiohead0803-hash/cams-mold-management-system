const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const EquipmentMaster = sequelize.define('EquipmentMaster', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    equipment_type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'injection_machine' },
    manufacturer: { type: DataTypes.STRING(100), allowNull: false },
    model_name: { type: DataTypes.STRING(100) },
    tonnage: { type: DataTypes.INTEGER },
    spec_info: { type: DataTypes.JSONB, defaultValue: {} },
    description: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'equipment_master',
    timestamps: false
  });

  EquipmentMaster.associate = (models) => {
    EquipmentMaster.hasMany(models.CompanyEquipment, { foreignKey: 'equipment_master_id', as: 'companyEquipments' });
    EquipmentMaster.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return EquipmentMaster;
};
