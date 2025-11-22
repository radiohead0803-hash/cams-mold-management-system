const { Model, DataTypes } = require('sequelize');

/**
 * 금형 공정 단계 모델 (12단계)
 * 1. 도면접수
 * 2. 몰드베이스발주
 * 3. 금형설계
 * 4. 도면검토회
 * 5. 상형가공
 * 6. 하형가공
 * 7. 상형열처리
 * 8. 하형열처리
 * 9. 상형경도측정
 * 10. 하형경도측정
 * 11. 조립
 * 12. 시운전
 */
class MoldProcessStep extends Model {
  static associate(models) {
    // MoldDevelopmentPlan 관계
    MoldProcessStep.belongsTo(models.MoldDevelopmentPlan, {
      foreignKey: 'development_plan_id',
      as: 'developmentPlan'
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
        development_plan_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'mold_development_plans',
            key: 'id'
          }
        },
        // 단계 정보
        step_number: {
          type: DataTypes.INTEGER,
          allowNull: false,
          comment: '단계 번호 (1-12)'
        },
        step_name: {
          type: DataTypes.STRING(100),
          allowNull: false,
          comment: '공정명'
        },
        // 제작일정
        start_date: {
          type: DataTypes.DATEONLY,
          comment: '시작일'
        },
        planned_completion_date: {
          type: DataTypes.DATEONLY,
          comment: '계획 완료일'
        },
        actual_completion_date: {
          type: DataTypes.DATEONLY,
          comment: '실제 완료일'
        },
        // 상태
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'pending',
          comment: 'pending, in_progress, completed, delayed'
        },
        status_display: {
          type: DataTypes.STRING(50),
          comment: '상태 표시 (완료, 진행중, 진행예정)'
        },
        // 비고 및 일정
        notes: {
          type: DataTypes.TEXT,
          comment: '비고'
        },
        days_remaining: {
          type: DataTypes.STRING(20),
          comment: '일정 (D+00 형식)'
        },
        // 담당자
        assignee: {
          type: DataTypes.STRING(100),
          comment: '담당자'
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
        modelName: 'MoldProcessStep',
        tableName: 'mold_process_steps',
        timestamps: false,
        indexes: [
          { fields: ['development_plan_id'] },
          { fields: ['status'] },
          { fields: ['step_number'] },
          { unique: true, fields: ['development_plan_id', 'step_number'] }
        ]
      }
    );
  }

  /**
   * 12단계 공정 기본 데이터
   */
  static get PROCESS_STEPS() {
    return [
      { step_number: 1, step_name: '도면접수' },
      { step_number: 2, step_name: '몰드베이스발주' },
      { step_number: 3, step_name: '금형설계' },
      { step_number: 4, step_name: '도면검토회' },
      { step_number: 5, step_name: '상형가공' },
      { step_number: 6, step_name: '하형가공' },
      { step_number: 7, step_name: '상형열처리' },
      { step_number: 8, step_name: '하형열처리' },
      { step_number: 9, step_name: '상형경도측정' },
      { step_number: 10, step_name: '하형경도측정' },
      { step_number: 11, step_name: '조립' },
      { step_number: 12, step_name: '시운전' }
    ];
  }

  /**
   * 상태 표시 업데이트
   */
  updateStatusDisplay() {
    const statusMap = {
      completed: '완료',
      in_progress: '진행중',
      pending: '진행예정',
      delayed: '지연'
    };
    this.status_display = statusMap[this.status] || '진행예정';
  }

  /**
   * 남은 일수 계산
   */
  calculateDaysRemaining() {
    if (!this.planned_completion_date) return null;

    const today = new Date();
    const planned = new Date(this.planned_completion_date);
    const diffTime = planned - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    this.days_remaining = diffDays >= 0 ? `D+${diffDays}` : `D${diffDays}`;
    return this.days_remaining;
  }
}

module.exports = MoldProcessStep;
