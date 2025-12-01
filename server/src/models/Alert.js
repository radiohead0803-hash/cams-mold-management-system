module.exports = (sequelize, DataTypes) => {
  const Alert = sequelize.define('Alert', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    mold_id: {
      type: DataTypes.INTEGER
    },
    alert_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'inspection_due, inspection_overdue, shot_milestone, issue_created, etc.'
    },
    priority: {
      type: DataTypes.STRING(20),
      defaultValue: 'medium',
      comment: 'urgent, high, medium, low'
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT
    },
    target_users: {
      type: DataTypes.JSONB,
      comment: 'Array of user IDs to notify'
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    read_at: {
      type: DataTypes.DATE
    },
    created_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'alerts',
    timestamps: false,
    indexes: [
      { fields: ['mold_id'] },
      { fields: ['alert_type'] },
      { fields: ['priority'] },
      { fields: ['is_read'] },
      { fields: ['created_at'] }
    ]
  });

  Alert.associate = (models) => {
    if (models.Mold) {
      Alert.belongsTo(models.Mold, {
        foreignKey: 'mold_id',
        as: 'mold'
      });
    }
  };

  return Alert;
};
