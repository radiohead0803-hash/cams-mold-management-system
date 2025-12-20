const { Model, DataTypes } = require('sequelize');

/**
 * 금형육성 문제점 코멘트 모델
 * - 협업용 코멘트
 */
class MoldNurturingProblemComment extends Model {
  static associate(models) {
    if (models.MoldNurturingProblem) {
      MoldNurturingProblemComment.belongsTo(models.MoldNurturingProblem, {
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
        comment_text: {
          type: DataTypes.TEXT,
          allowNull: false,
          comment: '코멘트 내용'
        },
        attachments: {
          type: DataTypes.JSONB,
          comment: '첨부파일 URL 배열'
        },
        created_by: {
          type: DataTypes.BIGINT,
          comment: '작성자 ID'
        },
        created_by_name: {
          type: DataTypes.STRING(100),
          comment: '작성자명'
        },
        created_at: {
          type: DataTypes.DATE,
          defaultValue: DataTypes.NOW
        }
      },
      {
        sequelize,
        modelName: 'MoldNurturingProblemComment',
        tableName: 'mold_nurturing_problem_comments',
        timestamps: false,
        indexes: [
          { fields: ['problem_id'] }
        ]
      }
    );
  }
}

module.exports = MoldNurturingProblemComment;
