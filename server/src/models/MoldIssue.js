module.exports = (sequelize, DataTypes) => {
  const MoldIssue = sequelize.define('MoldIssue', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mold_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    issue_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'defect, maintenance, repair, etc.'
    },
    severity: {
      type: DataTypes.STRING(20),
      comment: 'minor, major, critical'
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    reported_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reported_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.STRING(20),
      defaultValue: 'open',
      comment: 'open, in_progress, resolved, closed'
    },
    resolution: {
      type: DataTypes.TEXT
    },
    resolved_by: {
      type: DataTypes.INTEGER
    },
    resolved_at: {
      type: DataTypes.DATE
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    updated_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'mold_issues',
    timestamps: false,
    indexes: [
      { fields: ['mold_id'] },
      { fields: ['status'] },
      { fields: ['severity'] },
      { fields: ['reported_at'] }
    ]
  });

  MoldIssue.associate = (models) => {
    MoldIssue.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });
    MoldIssue.hasMany(models.DailyCheckItemStatus, {
      foreignKey: 'issue_id',
      as: 'checkItemStatuses'
    });
  };

  return MoldIssue;
};
