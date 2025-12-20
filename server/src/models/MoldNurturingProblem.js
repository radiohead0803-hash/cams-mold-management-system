const { Model, DataTypes } = require('sequelize');

/**
 * 금형육성 문제점 관리 모델
 * - TRY1~TRYn, 초기양산, 안정화 단계 문제 추적
 * - 디지털 필드 기반 CRUD
 * - 상태 워크플로우 포함
 */
class MoldNurturingProblem extends Model {
  static associate(models) {
    // Mold 관계
    if (models.Mold) {
      MoldNurturingProblem.belongsTo(models.Mold, {
        foreignKey: 'mold_id',
        as: 'mold'
      });
    }
    
    // MoldSpecification 관계
    if (models.MoldSpecification) {
      MoldNurturingProblem.belongsTo(models.MoldSpecification, {
        foreignKey: 'mold_spec_id',
        as: 'specification'
      });
    }
    
    // User 관계
    if (models.User) {
      MoldNurturingProblem.belongsTo(models.User, {
        foreignKey: 'created_by',
        as: 'creator'
      });
    }
    
    // History 관계
    if (models.MoldNurturingProblemHistory) {
      MoldNurturingProblem.hasMany(models.MoldNurturingProblemHistory, {
        foreignKey: 'problem_id',
        as: 'histories'
      });
    }
    
    // Comment 관계
    if (models.MoldNurturingProblemComment) {
      MoldNurturingProblem.hasMany(models.MoldNurturingProblemComment, {
        foreignKey: 'problem_id',
        as: 'comments'
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
        problem_number: {
          type: DataTypes.STRING(50),
          unique: true,
          comment: '문제점 번호 (MNP-YYYYMMDD-XXX)'
        },
        mold_id: {
          type: DataTypes.BIGINT,
          allowNull: false,
          comment: '금형 ID'
        },
        mold_spec_id: {
          type: DataTypes.BIGINT,
          comment: '금형제작사양 ID'
        },
        // 육성 단계
        nurturing_stage: {
          type: DataTypes.STRING(30),
          allowNull: false,
          comment: 'TRY_1, TRY_2, TRY_3, INITIAL_PRODUCTION, STABILIZATION'
        },
        // 문제점 기본 정보
        occurrence_date: {
          type: DataTypes.DATEONLY,
          allowNull: false,
          comment: '발생일자'
        },
        discovered_by: {
          type: DataTypes.STRING(30),
          allowNull: false,
          comment: '발견 주체 (mold_developer, maker, plant)'
        },
        problem_types: {
          type: DataTypes.JSONB,
          comment: '문제 유형 배열'
        },
        problem_summary: {
          type: DataTypes.STRING(500),
          allowNull: false,
          comment: '문제 요약'
        },
        problem_detail: {
          type: DataTypes.TEXT,
          comment: '상세 내용'
        },
        occurrence_location: {
          type: DataTypes.STRING(500),
          comment: '발생 위치'
        },
        location_image_url: {
          type: DataTypes.STRING(500),
          comment: '위치 이미지 URL'
        },
        severity: {
          type: DataTypes.STRING(20),
          allowNull: false,
          defaultValue: 'minor',
          comment: '심각도 (minor, major, critical)'
        },
        // 원인 분석
        cause_types: {
          type: DataTypes.JSONB,
          comment: '추정 원인 유형 배열'
        },
        cause_detail: {
          type: DataTypes.TEXT,
          comment: '상세 원인 설명'
        },
        recurrence_risk: {
          type: DataTypes.STRING(20),
          comment: '재발 가능성 (low, medium, high)'
        },
        // 개선 조치 계획
        improvement_required: {
          type: DataTypes.BOOLEAN,
          defaultValue: true,
          comment: '개선 필요 여부'
        },
        improvement_action: {
          type: DataTypes.TEXT,
          comment: '개선 조치 내용'
        },
        action_responsible: {
          type: DataTypes.STRING(30),
          comment: '조치 담당 (mold_developer, maker, plant)'
        },
        improvement_methods: {
          type: DataTypes.JSONB,
          comment: '개선 방법 유형 배열'
        },
        planned_completion_date: {
          type: DataTypes.DATEONLY,
          comment: '계획 완료 예정일'
        },
        // 개선 결과 및 검증
        action_status: {
          type: DataTypes.STRING(30),
          defaultValue: 'not_started',
          comment: '조치 완료 여부 (not_started, completed, insufficient)'
        },
        verification_stage: {
          type: DataTypes.STRING(30),
          comment: '재확인 단계 (same_try, next_try, initial_production)'
        },
        result_description: {
          type: DataTypes.TEXT,
          comment: '개선 후 결과 설명'
        },
        is_recurred: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '재발 여부'
        },
        final_judgment: {
          type: DataTypes.STRING(30),
          comment: '최종 판정 (ok, conditional_ok, re_action_required)'
        },
        // 상태 워크플로우
        status: {
          type: DataTypes.STRING(30),
          allowNull: false,
          defaultValue: 'registered',
          comment: 'registered, analyzing, improving, verifying, closed, reopened'
        },
        // 증빙 자료
        occurrence_photos: {
          type: DataTypes.JSONB,
          comment: '발생 사진 URL 배열'
        },
        before_after_photos: {
          type: DataTypes.JSONB,
          comment: '개선 전/후 비교 사진'
        },
        related_documents: {
          type: DataTypes.JSONB,
          comment: '관련 문서 URL 배열'
        },
        // 작성자 정보
        created_by: {
          type: DataTypes.BIGINT,
          comment: '작성자 ID'
        },
        created_by_name: {
          type: DataTypes.STRING(100),
          comment: '작성자명'
        },
        updated_by: {
          type: DataTypes.BIGINT,
          comment: '수정자 ID'
        },
        updated_by_name: {
          type: DataTypes.STRING(100),
          comment: '수정자명'
        },
        metadata: {
          type: DataTypes.JSONB,
          comment: '추가 메타데이터'
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
        modelName: 'MoldNurturingProblem',
        tableName: 'mold_nurturing_problems',
        timestamps: false,
        indexes: [
          { fields: ['mold_id'] },
          { fields: ['nurturing_stage'] },
          { fields: ['status'] },
          { fields: ['severity'] },
          { fields: ['is_recurred'] },
          { fields: ['created_at'] }
        ]
      }
    );
  }

  // 육성 단계 목록
  static get NURTURING_STAGES() {
    return [
      { code: 'TRY_1', name: 'TRY 1차', order: 1 },
      { code: 'TRY_2', name: 'TRY 2차', order: 2 },
      { code: 'TRY_3', name: 'TRY 3차', order: 3 },
      { code: 'INITIAL_PRODUCTION', name: '초기 양산 (SOP-3개월)', order: 4 },
      { code: 'STABILIZATION', name: '양산 안정화', order: 5 }
    ];
  }

  // 상태 목록
  static get STATUSES() {
    return [
      { code: 'registered', name: '등록됨', order: 1, color: 'gray' },
      { code: 'analyzing', name: '원인 분석 중', order: 2, color: 'blue' },
      { code: 'improving', name: '개선 조치 진행', order: 3, color: 'yellow' },
      { code: 'verifying', name: '재확인 중', order: 4, color: 'purple' },
      { code: 'closed', name: '종결', order: 5, color: 'green' },
      { code: 'reopened', name: '재발', order: 6, color: 'red' }
    ];
  }

  // 심각도 목록
  static get SEVERITIES() {
    return [
      { code: 'minor', name: 'Minor', color: 'green' },
      { code: 'major', name: 'Major', color: 'yellow' },
      { code: 'critical', name: 'Critical', color: 'red' }
    ];
  }

  // 문제 유형 목록
  static get PROBLEM_TYPES() {
    return [
      { code: 'APPEARANCE', name: '외관' },
      { code: 'DIMENSION', name: '치수' },
      { code: 'FUNCTION', name: '기능' },
      { code: 'STRUCTURE', name: '구조' },
      { code: 'DURABILITY', name: '내구' },
      { code: 'EJECTION', name: '취출' },
      { code: 'COOLING', name: '냉각' },
      { code: 'OTHER', name: '기타' }
    ];
  }

  // 원인 유형 목록
  static get CAUSE_TYPES() {
    return [
      { code: 'DESIGN', name: '설계' },
      { code: 'MACHINING', name: '가공' },
      { code: 'ASSEMBLY', name: '조립' },
      { code: 'MATERIAL', name: '재질' },
      { code: 'INJECTION', name: '사출조건' },
      { code: 'MANAGEMENT', name: '관리 미흡' }
    ];
  }

  // 발견 주체 목록
  static get DISCOVERED_BY_OPTIONS() {
    return [
      { code: 'mold_developer', name: '금형개발' },
      { code: 'maker', name: '제작처' },
      { code: 'plant', name: '생산처' }
    ];
  }
}

module.exports = MoldNurturingProblem;
