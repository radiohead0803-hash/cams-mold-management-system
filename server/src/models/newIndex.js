const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(dbConfig.url, dbConfig);

// Import all models
const User = require('./User');
const Mold = require('./Mold');
const DailyCheck = require('./DailyCheck');
const DailyCheckItem = require('./DailyCheckItem');
const DailyCheckItemStatus = require('./DailyCheckItemStatus');
const CheckItemMaster = require('./CheckItemMaster');
const CheckGuideMaterial = require('./CheckGuideMaterial');
const Inspection = require('./Inspection');
const InspectionItem = require('./InspectionItem');
const InspectionPhoto = require('./InspectionPhoto');
const MoldSpecification = require('./MoldSpecification');
const MakerSpecification = require('./MakerSpecification');
const Repair = require('./Repair');
const Transfer = require('./Transfer');
const Notification = require('./Notification');
const Shot = require('./Shot');
const GPSLocation = require('./GPSLocation');
const Alert = require('./Alert');
const MoldIssue = require('./MoldIssue');
const ChecklistMasterTemplate = require('./ChecklistMasterTemplate');
const ChecklistTemplateItem = require('./ChecklistTemplateItem');
const ChecklistTemplateDeployment = require('./ChecklistTemplateDeployment');
const ChecklistTemplateHistory = require('./ChecklistTemplateHistory');
const ChecklistTemplate = require('./ChecklistTemplate');
const ChecklistInstance = require('./ChecklistInstance');
const ChecklistAnswer = require('./ChecklistAnswer');
const QRSession = require('./QRSession');
const ProductionQuantity = require('./ProductionQuantity');
const MoldDevelopmentPlan = require('./MoldDevelopmentPlan');
const MoldProcessStep = require('./MoldProcessStep');
const PreProductionChecklist = require('./PreProductionChecklist');
const Company = require('./Company');
const UserRequest = require('./UserRequest');
const CarModel = require('./CarModel');
const Material = require('./Material');
const MoldType = require('./MoldType');
const Tonnage = require('./Tonnage');

// Helper function to initialize models
const initModel = (ModelClass, sequelize) => {
  // Check if it's a class with static init method
  if (ModelClass.init && typeof ModelClass.init === 'function') {
    return ModelClass.init(sequelize);
  }
  // Otherwise, it's a function that returns initialized model
  return ModelClass(sequelize, Sequelize.DataTypes);
};

// Initialize all models
const models = {
  User: initModel(User, sequelize),
  Mold: initModel(Mold, sequelize),
  DailyCheck: initModel(DailyCheck, sequelize),
  DailyCheckItem: initModel(DailyCheckItem, sequelize),
  DailyCheckItemStatus: initModel(DailyCheckItemStatus, sequelize),
  CheckItemMaster: initModel(CheckItemMaster, sequelize),
  CheckGuideMaterial: initModel(CheckGuideMaterial, sequelize),
  Inspection: initModel(Inspection, sequelize),
  InspectionItem: initModel(InspectionItem, sequelize),
  InspectionPhoto: initModel(InspectionPhoto, sequelize),
  MoldSpecification: initModel(MoldSpecification, sequelize),
  MakerSpecification: initModel(MakerSpecification, sequelize),
  Repair: initModel(Repair, sequelize),
  Transfer: initModel(Transfer, sequelize),
  Notification: initModel(Notification, sequelize),
  Shot: initModel(Shot, sequelize),
  GPSLocation: initModel(GPSLocation, sequelize),
  Alert: initModel(Alert, sequelize),
  MoldIssue: initModel(MoldIssue, sequelize),
  ChecklistMasterTemplate: initModel(ChecklistMasterTemplate, sequelize),
  ChecklistTemplateItem: initModel(ChecklistTemplateItem, sequelize),
  ChecklistTemplateDeployment: initModel(ChecklistTemplateDeployment, sequelize),
  ChecklistTemplateHistory: initModel(ChecklistTemplateHistory, sequelize),
  ChecklistTemplate: initModel(ChecklistTemplate, sequelize),
  ChecklistInstance: initModel(ChecklistInstance, sequelize),
  ChecklistAnswer: initModel(ChecklistAnswer, sequelize),
  QRSession: initModel(QRSession, sequelize),
  ProductionQuantity: initModel(ProductionQuantity, sequelize),
  MoldDevelopmentPlan: initModel(MoldDevelopmentPlan, sequelize),
  MoldProcessStep: initModel(MoldProcessStep, sequelize),
  PreProductionChecklist: initModel(PreProductionChecklist, sequelize),
  Company: initModel(Company, sequelize),
  UserRequest: initModel(UserRequest, sequelize),
  CarModel: initModel(CarModel, sequelize),
  Material: initModel(Material, sequelize),
  MoldType: initModel(MoldType, sequelize),
  Tonnage: initModel(Tonnage, sequelize)
};

// Setup associations
Object.values(models).forEach(model => {
  if (model.associate) {
    model.associate(models);
  }
});

// Export sequelize instance and models
module.exports = {
  sequelize,
  Sequelize,
  ...models
};
