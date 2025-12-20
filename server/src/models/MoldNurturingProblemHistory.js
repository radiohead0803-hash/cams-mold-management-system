const { Model, DataTypes } = require('sequelize');

/**
 * 금형육성 문제점 이력 모델
 * - 수정 이력 자동 기록
 */
class MoldNurturingProblemHistory extends Model {
  static associate(models) {
    if (models.MoldNurturingProblem) {
      MoldNurturingProblemHistory.belongsTo(models.MoldNurturingProblem, {
        foreignKey: 'problem_id',
        as: 'problem'
      });
    }
  }

  static init(sequelize) {
    return super.init(
      {
        id: {
          type: DataTypes.INTEGER,
          primaryKey: true,
          autoIncrement: true
        },
        problem_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          comment: '문제점 ID'
        },
        action_type: {
          type: DataTypes.STRING(30),
          allowNull: false,
          comment: 'created, updated, status_changed, reopened'
        },
        previous_status: {
          type: DataTypes.STRING(30),
          comment: '이전 상태'
        },
        new_status: {
          type: DataTypes.STRING(30),
          comment: '새 상태'
        },
        changed_fields: {
          type: DataTypes.JSONB,
          comment: '변경된 필드 목록'
        },
        change_description: {
          type: DataTypes.TEXT,
          comment: '변경 설명'
        },
        changed_by: {
          type: DataTypes.BIGINT,
          comment: '변경자 ID'
        },
        changed_by_name: {
          type: DataTypes.STRING(100),
          comment: '변경자명'
        },
        changed_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW,
          comment: '변경 시간'
        }
      },
      {
        sequelize,
        modelName: 'MoldNurturingProblemHistory',
        tableName: 'mold_nurturing_problem_histories',
        timestamps: false,
        indexes: [
          { fields: ['problem_id'] },
          { fields: ['action_type'] }
        ]
      }
    );
  }
}

module.exports = MoldNurturingProblemHistory;
