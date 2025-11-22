const { Model, DataTypes } = require('sequelize');

/**
 * 생산수량 모델
 * - 일상점검 시 생산수량 입력 (필수)
 * - 타수 자동 누적 (molds.current_shots)
 * - 점검 스케줄 자동 업데이트
 */
class ProductionQuantity extends Model {
  static associate(models) {
    // Mold 관계
    ProductionQuantity.belongsTo(models.Mold, {
      foreignKey: 'mold_id',
      as: 'mold'
    });

    // User 관계
    ProductionQuantity.belongsTo(models.User, {
      foreignKey: 'recorded_by',
      as: 'recorder'
    });

    // DailyCheck 관계 (선택적)
    ProductionQuantity.belongsTo(models.DailyCheck, {
      foreignKey: 'daily_check_id',
      as: 'dailyCheck'
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
        mold_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'molds',
            key: 'id'
          }
        },
        daily_check_id: {
          type: DataTypes.INTEGER,
          references: {
            model: 'daily_checks',
            key: 'id'
          },
          comment: '일상점검 ID (일상점검과 함께 입력 시)'
        },
        production_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: '생산 날짜'
        },
        shift: {
          type: DataTypes.STRING(20),
          comment: '근무 시간대 (주간/야간/24시간)'
        },
        quantity: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '생산 수량 (개)'
        },
        shots_increment: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '타수 증가량 (수량 / cavity)'
        },
        cavity_count: {
          type: DataTypes.INTEGER,
          comment: '캐비티 수 (기록 시점)'
        },
        previous_shots: {
          type: DataTypes.INTEGER,
          comment: '이전 타수'
        },
        current_shots: {
          type: DataTypes.INTEGER,
          comment: '현재 타수 (이전 + 증가량)'
        },
        recorded_by: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        notes: {
          type: DataTypes.TEXT,
          comment: '비고'
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        },
        updated_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'ProductionQuantity',
        tableName: 'production_quantities',
        timestamps: false,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['production_date'] },
          { fields: ['recorded_by'] },
          { fields: ['daily_check_id'] }
        ]
      }
    );
  }
}

module.exports = ProductionQuantity;
