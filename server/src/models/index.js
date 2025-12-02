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

// New checklist models (Class-based)
const ChecklistTemplate = require('./ChecklistTemplate');
const ChecklistTemplateItem = require('./ChecklistTemplateItem');
const ChecklistInstance = require('./ChecklistInstance');
const ChecklistAnswer = require('./ChecklistAnswer');

db.ChecklistTemplate = ChecklistTemplate.init(sequelize);
db.ChecklistTemplateItem = ChecklistTemplateItem.init(sequelize);
db.ChecklistInstance = ChecklistInstance.init(sequelize);
db.ChecklistAnswer = ChecklistAnswer.init(sequelize);

// Master data models
db.CarModel = require('./CarModel')(sequelize, Sequelize.DataTypes);
db.Material = require('./Material')(sequelize, Sequelize.DataTypes);
db.MoldType = require('./MoldType')(sequelize, Sequelize.DataTypes);
db.Tonnage = require('./Tonnage')(sequelize, Sequelize.DataTypes);

// Setup associations
Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
