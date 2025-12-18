const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, dbConfig);

const db = {};

// Import models
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Mold = require('./Mold')(sequelize, Sequelize.DataTypes);
db.ChecklistMasterTemplate = require('./ChecklistMasterTemplate')(sequelize, Sequelize.DataTypes);
db.ChecklistTemplateDeployment = require('./ChecklistTemplateDeployment')(sequelize, Sequelize.DataTypes);
db.ChecklistTemplateHistory = require('./ChecklistTemplateHistory')(sequelize, Sequelize.DataTypes);
db.DailyCheckItem = require('./DailyCheckItem')(sequelize, Sequelize.DataTypes);
db.DailyCheckItemStatus = require('./DailyCheckItemStatus')(sequelize, Sequelize.DataTypes);
db.InspectionPhoto = require('./InspectionPhoto')(sequelize, Sequelize.DataTypes);
db.MoldIssue = require('./MoldIssue')(sequelize, Sequelize.DataTypes);
db.Alert = require('./Alert')(sequelize, Sequelize.DataTypes);
db.MoldLocationLog = require('./MoldLocationLog')(sequelize, Sequelize.DataTypes);

// New checklist models (Function-based - consistent with other models)
db.ChecklistTemplate = require('./ChecklistTemplate')(sequelize, Sequelize.DataTypes);
db.ChecklistTemplateItem = require('./ChecklistTemplateItem')(sequelize, Sequelize.DataTypes);
db.ChecklistInstance = require('./ChecklistInstance')(sequelize, Sequelize.DataTypes);
db.ChecklistAnswer = require('./ChecklistAnswer')(sequelize, Sequelize.DataTypes);

// Master data models
db.CarModel = require('./CarModel')(sequelize, Sequelize.DataTypes);
db.Material = require('./Material')(sequelize, Sequelize.DataTypes);
db.MoldType = require('./MoldType')(sequelize, Sequelize.DataTypes);
db.Tonnage = require('./Tonnage')(sequelize, Sequelize.DataTypes);

// Repair Shipment Checklist models
db.RepairShipmentChecklist = require('./RepairShipmentChecklist')(sequelize, Sequelize.DataTypes);
db.RepairShipmentChecklistItem = require('./RepairShipmentChecklistItem')(sequelize, Sequelize.DataTypes);

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
