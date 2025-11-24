const { Model, DataTypes } = require('sequelize');

class UserRequest extends Model {
  static associate(models) {
    // Company 관계
    UserRequest.belongsTo(models.Company, {
      foreignKey: 'company_id',
      as: 'company'
    });
    
    // 요청자 관계
    UserRequest.belongsTo(models.User, {
      foreignKey: 'requested_by',
      as: 'requester'
    });
    
    // 승인자 관계
    UserRequest.belongsTo(models.User, {
      foreignKey: 'approved_by',
      as: 'approver'
    });
    
    // 생성된 사용자 관계
    UserRequest.belongsTo(models.User, {
      foreignKey: 'created_user_id',
      as: 'createdUser'
    });
  }
}

module.exports = (sequelize) => {
  UserRequest.init({
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    company_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '업체 ID'
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: '요청자 ID (금형개발 담당자)'
    },
    username: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: '요청할 사용자 ID'
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      comment: '사용자 이름'
    },
    email: {
      type: DataTypes.STRING(100),
      comment: '이메일'
    },
    phone: {
      type: DataTypes.STRING(20),
      comment: '전화번호'
    },
    user_type: {
      type: DataTypes.STRING(20),
      allowNull: false,
      comment: 'maker 또는 plant',
      validate: {
        isIn: [['maker', 'plant']]
      }
    },
    department: {
      type: DataTypes.STRING(100),
      comment: '부서'
    },
    position: {
      type: DataTypes.STRING(50),
      comment: '직급'
    },
    request_reason: {
      type: DataTypes.TEXT,
      comment: '요청 사유'
    },
    status: {
      type: DataTypes.STRING(20),
      allowNull: false,
      defaultValue: 'pending',
      comment: 'pending: 대기, approved: 승인, rejected: 거부',
      validate: {
        isIn: [['pending', 'approved', 'rejected']]
      }
    },
    approved_by: {
      type: DataTypes.INTEGER,
      comment: '승인자 ID (시스템 관리자)'
    },
    approved_at: {
      type: DataTypes.DATE,
      comment: '승인 일시'
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      comment: '거부 사유'
    },
    created_user_id: {
      type: DataTypes.INTEGER,
      comment: '생성된 사용자 ID'
    }
  }, {
    sequelize,
    modelName: 'UserRequest',
    tableName: 'user_requests',
    timestamps: true,
    underscored: true,
    comment: '사용자 계정 요청'
  });

  return UserRequest;
};
