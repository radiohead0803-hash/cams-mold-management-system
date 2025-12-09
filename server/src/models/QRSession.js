const { Model, DataTypes } = require('sequelize');

/**
 * QR 세션 모델
 * - QR 스캔 시 8시간 유효한 세션 생성
 * - 금형 정보 자동 로드 및 작업 권한 부여
 */
class QRSession extends Model {
  static associate(models) {
    // User 관계
    QRSession.belongsTo(models.User, {
      foreignKey: 'user_id',
      as: 'user'
    });

    // Mold 관계
    QRSession.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });
  }

  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        session_token: {
          type: DataTypes.STRING(255),
          unique: true,
          allowNull: false,
          comment: 'QR 세션 토큰 (UUID)'
        },
        user_id: {
          type: DataTypes.INTEGER,
          allowNull: true, // 비로그인 상태에서도 QR 스캔 가능
          references: {
            model: 'users',
            key: 'id'
          }
        },
        mold_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'molds',
            key: 'id'
          }
        },
        qr_code: {
          type: DataTypes.STRING(255),
          allowNull: false,
          comment: '스캔한 QR 코드'
        },
        expires_at: {
          type: DataTypes.DATE,
          allowNull: false,
          comment: '세션 만료 시간 (8시간 후)'
        },
        is_active: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          comment: '세션 활성 상태'
        },
        gps_latitude: {
          type: DataTypes.DECIMAL(10, 8),
          comment: 'GPS 위도'
        },
        gps_longitude: {
          type: DataTypes.DECIMAL(11, 8),
          comment: 'GPS 경도'
        },
        device_info: {
          type: DataTypes.JSONB,
          comment: '디바이스 정보 (브라우저, OS 등)'
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'QRSession',
        tableName: 'qr_sessions',
        timestamps: false,
        indexes: [
          { fields: ['session_token'] },
          { fields: ['user_id'] },
          { fields: ['mold_id'] },
          { fields: ['qr_code'] },
          { fields: ['expires_at'] },
          { fields: ['is_active'] }
        ]
      }
    );
  }

  /**
   * 세션이 유효한지 확인
   */
  isValid() {
    return this.is_active && new Date() < new Date(this.expires_at);
  }

  /**
   * 세션 만료 처리
   */
  async expire() {
    this.is_active = false;
    await this.save();
  }
}

module.exports = QRSession;
