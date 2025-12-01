module.exports = (sequelize, DataTypes) => {
  const DailyCheckItemStatus = sequelize.define('DailyCheckItemStatus', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    daily_check_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'ok, ng, warning, not_applicable'
    },
    notes: {
      type: DataTypes.TEXT
    },
    cleaning_agent: {
      type: DataTypes.STRING(50)
    },
    photo_refs: {
      type: DataTypes.JSONB,
      comment: 'Array of photo IDs'
    },
    issue_id: {
      type: DataTypes.INTEGER
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'daily_check_item_status',
    timestamps: false,
    indexes: [
      { fields: ['daily_check_id'] },
      { fields: ['item_id'] },
      { fields: ['status'] }
    ]
  });

  DailyCheckItemStatus.associate = (models) => {
    if (models.DailyCheckItem) {
      DailyCheckItemStatus.belongsTo(models.DailyCheckItem, {
        foreignKey: 'daily_check_id',
        as: 'dailyCheck'
      });
    }
    
    if (models.MoldIssue) {
      DailyCheckItemStatus.belongsTo(models.MoldIssue, {
        foreignKey: 'issue_id',
        as: 'issue'
      });
    }
    
    if (models.InspectionPhoto) {
      DailyCheckItemStatus.hasMany(models.InspectionPhoto, {
        foreignKey: 'item_status_id',
        as: 'photos'
      });
    }
  };

  return DailyCheckItemStatus;
};
