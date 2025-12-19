const { Model, DataTypes } = require('sequelize');

/**
 * 금형 공정 단계 모델 (14단계 + 사용자 정의)
 * 개발 단계 (12단계):
 * 1. 도면접수
 * 2. 몰드베이스발주
 * 3. 금형설계
 * 4. 도면검토회
 * 5. 상형가공
 * 6. 하형가공
 * 7. 코어가공
 * 8. 방전
 * 9. 격면사상
 * 10. 금형조립
 * 11. 습합
 * 12. 초도 T/O
 * 금형육성 단계:
 * 13. 초도T/O 이후 금형육성
 * 양산이관 단계:
 * 14. 양산이관
 * + 사용자 정의 단계 추가/삭제 가능
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
        // 사용자 정의 단계 관련
        is_custom: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '사용자 정의 단계 여부'
        },
        is_deleted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '삭제 여부 (soft delete)'
        },
        category: {
          type: DataTypes.STRING(50),
          defaultValue: 'development',
          comment: '카테고리 (development, nurturing, transfer)'
        },
        sort_order: {
          type: DataTypes.INTEGER,
          comment: '정렬 순서'
        },
        default_days: {
          type: DataTypes.INTEGER,
          defaultValue: 5,
          comment: '기본 소요일'
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
          { fields: ['category'] },
          { fields: ['is_custom'] },
          { fields: ['is_deleted'] },
          { fields: ['sort_order'] }
        ]
      }
    );
  }

  /**
   * 14단계 공정 기본 데이터 (개발 12단계 + 금형육성 + 양산이관)
   */
  static get PROCESS_STEPS() {
    return [
      // 개발 단계 (12단계)
      { step_number: 1, step_name: '도면접수', category: 'development', default_days: 3, sort_order: 1 },
      { step_number: 2, step_name: '몰드베이스 발주', category: 'development', default_days: 5, sort_order: 2 },
      { step_number: 3, step_name: '금형설계', category: 'development', default_days: 10, sort_order: 3 },
      { step_number: 4, step_name: '도면검토회', category: 'development', default_days: 2, sort_order: 4 },
      { step_number: 5, step_name: '상형가공', category: 'development', default_days: 15, sort_order: 5 },
      { step_number: 6, step_name: '하형가공', category: 'development', default_days: 15, sort_order: 6 },
      { step_number: 7, step_name: '코어가공', category: 'development', default_days: 10, sort_order: 7 },
      { step_number: 8, step_name: '방전', category: 'development', default_days: 7, sort_order: 8 },
      { step_number: 9, step_name: '격면사상', category: 'development', default_days: 5, sort_order: 9 },
      { step_number: 10, step_name: '금형조립', category: 'development', default_days: 5, sort_order: 10 },
      { step_number: 11, step_name: '습합', category: 'development', default_days: 3, sort_order: 11 },
      { step_number: 12, step_name: '초도 T/O', category: 'development', default_days: 3, sort_order: 12 },
      // 금형육성 단계
      { step_number: 13, step_name: '초도T/O 이후 금형육성', category: 'nurturing', default_days: 30, sort_order: 13 },
      // 양산이관 단계
      { step_number: 14, step_name: '양산이관', category: 'transfer', default_days: 5, sort_order: 14 }
    ];
  }

  /**
   * 카테고리별 단계 조회
   */
  static getStepsByCategory(category) {
    return this.PROCESS_STEPS.filter(step => step.category === category);
  }

  /**
   * 카테고리 목록
   */
  static get CATEGORIES() {
    return [
      { code: 'development', name: '개발', color: 'blue' },
      { code: 'nurturing', name: '금형육성', color: 'green' },
      { code: 'transfer', name: '양산이관', color: 'purple' }
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
