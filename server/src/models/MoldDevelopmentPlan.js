const { Model, DataTypes } = require('sequelize');

/**
 * 금형개발계획 모델
 * - 12단계 공정 관리
 * - 진행률 자동 계산
 * - 금형제작사양 기반 자동 생성
 */
class MoldDevelopmentPlan extends Model {
  static associate(models) {
    // MoldSpecification 관계
    MoldDevelopmentPlan.belongsTo(models.MoldSpecification, {
      foreignKey: 'mold_specification_id',
      as: 'specification'
    });

    // User 관계
    MoldDevelopmentPlan.belongsTo(models.User, {
      foreignKey: 'created_by',
      as: 'creator'
    });

    // ProcessSteps 관계
    MoldDevelopmentPlan.hasMany(models.MoldProcessStep, {
      foreignKey: 'development_plan_id',
      as: 'processSteps'
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
        mold_specification_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'mold_specifications',
            key: 'id'
          }
        },
        // 자동 입력 항목
        car_model: {
          type: DataTypes.STRING(100),
          comment: '차종 (자동)'
        },
        part_number: {
          type: DataTypes.STRING(50),
          comment: '품번 (자동)'
        },
        part_name: {
          type: DataTypes.STRING(200),
          comment: '품명 (자동)'
        },
        schedule_code: {
          type: DataTypes.STRING(20),
          comment: '제작일정 코드 (D+144 형식)'
        },
        export_rate: {
          type: DataTypes.STRING(20),
          comment: '수출률 (6/1000 형식)'
        },
        // 수동 입력 항목
        raw_material: {
          type: DataTypes.STRING(100),
          comment: '원재료'
        },
        manufacturer: {
          type: DataTypes.STRING(100),
          comment: '제작자'
        },
        trial_order_date: {
          type: DataTypes.DATEONLY,
          comment: 'T/O일정'
        },
        start_status: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '시작 체크박스'
        },
        completion_status: {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          comment: '완성 체크박스'
        },
        material_upper_type: {
          type: DataTypes.STRING(100),
          comment: '상형 재질'
        },
        material_lower_type: {
          type: DataTypes.STRING(100),
          comment: '하형 재질'
        },
        part_weight: {
          type: DataTypes.DECIMAL(10, 2),
          comment: '부품중량(g)'
        },
        images: {
          type: DataTypes.JSONB,
          comment: '이미지 업로드'
        },
        // 진행률
        overall_progress: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: '전체 진행률 (0-100%)'
        },
        completed_steps: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: '완료된 단계 수'
        },
        total_steps: {
          type: DataTypes.INTEGER,
          defaultValue: 12,
          comment: '전체 단계 수 (12단계)'
        },
        current_step: {
          type: DataTypes.STRING(50),
          comment: '현재 진행 중인 단계'
        },
        // 상태
        status: {
          type: DataTypes.STRING(20),
          defaultValue: 'planning',
          comment: 'planning, in_progress, completed, delayed'
        },
        created_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
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
        modelName: 'MoldDevelopmentPlan',
        tableName: 'mold_development_plans',
        timestamps: false,
        indexes: [
          { fields: ['mold_specification_id'] },
          { fields: ['status'] },
          { fields: ['created_by'] }
        ]
      }
    );
  }

  /**
   * 진행률 계산 및 업데이트
   */
  async updateProgress() {
    const processSteps = await this.getProcessSteps();
    const completedCount = processSteps.filter(step => step.status === 'completed').length;
    const progress = Math.round((completedCount / this.total_steps) * 100);

    await this.update({
      completed_steps: completedCount,
      overall_progress: progress,
      status: progress === 100 ? 'completed' : progress > 0 ? 'in_progress' : 'planning',
      updated_at: new Date()
    });

    return { completedCount, progress };
  }
}

module.exports = MoldDevelopmentPlan;
