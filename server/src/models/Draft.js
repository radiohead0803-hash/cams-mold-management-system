module.exports = (sequelize, DataTypes) => {
  const Draft = sequelize.define('Draft', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    draft_key: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '메뉴 키 (periodic_inspection, scrapping, transfer, maintenance 등)'
    },
    draft_id: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '식별자 (moldId 또는 new)'
    },
    data: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: {},
      comment: '임시저장 데이터 (JSON)'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: '만료일 (7일 후 자동 삭제용)'
    }
  }, {
    tableName: 'drafts',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['user_id', 'draft_key', 'draft_id']
      }
    ]
  });

  return Draft;
};
