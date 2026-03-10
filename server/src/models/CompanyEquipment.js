const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const CompanyEquipment = sequelize.define('CompanyEquipment', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    company_id: { type: DataTypes.INTEGER, allowNull: false },
    equipment_master_id: { type: DataTypes.INTEGER },
    equipment_type: { type: DataTypes.STRING(50), allowNull: false, defaultValue: 'injection_machine' },
    manufacturer: { type: DataTypes.STRING(100), allowNull: false },
    model_name: { type: DataTypes.STRING(100) },
    tonnage: { type: DataTypes.INTEGER },
    serial_number: { type: DataTypes.STRING(100) },
    year_installed: { type: DataTypes.INTEGER },
    status: { type: DataTypes.STRING(30), defaultValue: 'active' },
    daily_capacity: { type: DataTypes.INTEGER },
    monthly_capacity: { type: DataTypes.INTEGER },
    spec_info: { type: DataTypes.JSONB, defaultValue: {} },
    notes: { type: DataTypes.TEXT },
    is_active: { type: DataTypes.BOOLEAN, defaultValue: true },
    created_by: { type: DataTypes.INTEGER },
    created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
    updated_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
  }, {
    tableName: 'company_equipment',
    timestamps: false
  });

  CompanyEquipment.associate = (models) => {
    CompanyEquipment.belongsTo(models.Company, { foreignKey: 'company_id', as: 'company' });
    CompanyEquipment.belongsTo(models.EquipmentMaster, { foreignKey: 'equipment_master_id', as: 'master' });
    CompanyEquipment.belongsTo(models.User, { foreignKey: 'created_by', as: 'creator' });
  };

  return CompanyEquipment;
};
