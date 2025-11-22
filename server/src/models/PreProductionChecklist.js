const { Model, DataTypes } = require('sequelize');

/**
 * 제작전 체크리스트 모델
 * - 81개 항목 (9개 카테고리)
 * - 도면검토회 전 필수 체크
 * - 승인 워크플로우
 */
class PreProductionChecklist extends Model {
  static associate(models) {
    // MoldSpecification 관계
    PreProductionChecklist.belongsTo(models.MoldSpecification, {
      foreignKey: 'mold_specification_id',
      as: 'specification'
    });

    // Maker (작성자)
    PreProductionChecklist.belongsTo(models.User, {
      foreignKey: 'maker_id',
      as: 'maker'
    });

    // Reviewer (검토자)
    PreProductionChecklist.belongsTo(models.User, {
      foreignKey: 'reviewed_by',
      as: 'reviewer'
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
        maker_id: {
          type: DataTypes.INTEGER,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        // 체크리스트 ID 및 제목
        checklist_id: {
          type: DataTypes.STRING(50),
          unique: true,
          comment: 'M-2024-001'
        },
        checklist_title: {
          type: DataTypes.STRING(200),
          comment: '체크리스트 제목'
        },
        checklist_type: {
          type: DataTypes.STRING(50),
          defaultValue: '제작전'
        },
        // 상단 헤더 정보
        total_items: {
          type: DataTypes.INTEGER,
          defaultValue: 81,
          comment: '총 점검항목 (81개)'
        },
        rejected_items: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: '반려 항목 수'
        },
        progress_rate: {
          type: DataTypes.DECIMAL(5, 2),
          defaultValue: 0,
          comment: '진행률 (%)'
        },
        status: {
          type: DataTypes.STRING(20),
          defaultValue: '승인대기',
          comment: '승인대기, 승인완료, 반려'
        },
        // 기본정보 (자동 입력)
        car_model: {
          type: DataTypes.STRING(100),
          comment: '차종 (자동)'
        },
        part_number: {
          type: DataTypes.STRING(50),
          comment: 'PART NUMBER (자동)'
        },
        part_name: {
          type: DataTypes.STRING(200),
          comment: 'PART NAME (자동)'
        },
        created_date: {
          type: DataTypes.DATEONLY,
          comment: '작성일 (자동)'
        },
        created_by_name: {
          type: DataTypes.STRING(100),
          comment: '작성자 (자동)'
        },
        production_plant: {
          type: DataTypes.STRING(100),
          comment: '양산처 (자동)'
        },
        maker_name: {
          type: DataTypes.STRING(100),
          comment: '제작처 (자동)'
        },
        injection_machine_tonnage: {
          type: DataTypes.STRING(50),
          comment: '양산 사출기 (수동)'
        },
        clamping_force: {
          type: DataTypes.STRING(50),
          comment: '형체력 (자동)'
        },
        eo_cut_date: {
          type: DataTypes.DATEONLY,
          comment: 'EO CUT (자동)'
        },
        trial_order_date: {
          type: DataTypes.DATEONLY,
          comment: '초도 T/O 일정 (자동)'
        },
        // 부품 그림
        part_images: {
          type: DataTypes.JSONB,
          comment: '부품 이미지 배열'
        },
        // 9개 카테고리 (총 81개 항목)
        category_material: {
          type: DataTypes.JSONB,
          comment: 'I. 원재료 (9개 항목)'
        },
        category_mold: {
          type: DataTypes.JSONB,
          comment: 'II. 금형 (13개 항목)'
        },
        category_gas_vent: {
          type: DataTypes.JSONB,
          comment: 'III. 가스 배기 (6개 항목)'
        },
        category_moldflow: {
          type: DataTypes.JSONB,
          comment: 'IV. 성형 해석 (11개 항목)'
        },
        category_sink_mark: {
          type: DataTypes.JSONB,
          comment: 'V. 싱크마크 (10개 항목)'
        },
        category_ejection: {
          type: DataTypes.JSONB,
          comment: 'VI. 취출 (10개 항목)'
        },
        category_mic: {
          type: DataTypes.JSONB,
          comment: 'VII. MIC 제품 (9개 항목)'
        },
        category_coating: {
          type: DataTypes.JSONB,
          comment: 'VIII. 도금 (7개 항목)'
        },
        category_rear_back_beam: {
          type: DataTypes.JSONB,
          comment: 'IX. 리어 백빔 (6개 항목)'
        },
        // 종합 결과
        ok_items: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: 'OK 항목 수'
        },
        ng_items: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: 'NG 항목 수'
        },
        na_items: {
          type: DataTypes.INTEGER,
          defaultValue: 0,
          comment: 'N/A 항목 수'
        },
        pass_rate: {
          type: DataTypes.DECIMAL(5, 2),
          comment: '합격률 (%)'
        },
        overall_result: {
          type: DataTypes.STRING(20),
          comment: 'pass, conditional_pass, fail'
        },
        // 특이사항
        special_notes: {
          type: DataTypes.TEXT,
          comment: '특이사항'
        },
        risk_assessment: {
          type: DataTypes.TEXT,
          comment: '리스크 평가'
        },
        // 제출 정보
        submitted: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        submitted_at: {
          type: DataTypes.DATE
        },
        // 승인 정보
        review_status: {
          type: DataTypes.STRING(20),
          defaultValue: 'pending',
          comment: 'pending, approved, rejected'
        },
        reviewed_by: {
          type: DataTypes.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          }
        },
        reviewed_by_name: {
          type: DataTypes.STRING(100)
        },
        reviewed_at: {
          type: DataTypes.DATE
        },
        review_comments: {
          type: DataTypes.TEXT,
          comment: '검토 의견'
        },
        required_corrections: {
          type: DataTypes.JSONB,
          comment: '반려 시 수정 요구사항'
        },
        // 승인 후 제작 시작
        production_approved: {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        },
        production_start_date: {
          type: DataTypes.DATEONLY
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
        modelName: 'PreProductionChecklist',
        tableName: 'pre_production_checklists',
        timestamps: false,
        indexes: [
          { fields: ['mold_specification_id'] },
          { fields: ['maker_id'] },
          { fields: ['review_status'] },
          { fields: ['checklist_id'], unique: true }
        ]
      }
    );
  }

  /**
   * 진행률 계산 및 업데이트
   */
  async calculateProgress() {
    const categories = [
      this.category_material,
      this.category_mold,
      this.category_gas_vent,
      this.category_moldflow,
      this.category_sink_mark,
      this.category_ejection,
      this.category_mic,
      this.category_coating,
      this.category_rear_back_beam
    ];

    let totalChecked = 0;
    let okCount = 0;
    let ngCount = 0;
    let naCount = 0;

    categories.forEach(category => {
      if (category && typeof category === 'object') {
        Object.values(category).forEach(item => {
          if (item.status) {
            totalChecked++;
            if (item.status === 'OK') okCount++;
            else if (item.status === 'NG') ngCount++;
            else if (item.status === 'N/A') naCount++;
          }
        });
      }
    });

    const progressRate = (totalChecked / this.total_items) * 100;
    const passRate = totalChecked > 0 ? (okCount / totalChecked) * 100 : 0;

    await this.update({
      ok_items: okCount,
      ng_items: ngCount,
      na_items: naCount,
      progress_rate: progressRate.toFixed(2),
      pass_rate: passRate.toFixed(2),
      overall_result: ngCount > 0 ? 'fail' : okCount === totalChecked ? 'pass' : 'conditional_pass',
      updated_at: new Date()
    });

    return { totalChecked, okCount, ngCount, naCount, progressRate, passRate };
  }

  /**
   * 9개 카테고리 항목 수
   */
  static get CATEGORY_ITEM_COUNTS() {
    return {
      material: 9,
      mold: 13,
      gas_vent: 6,
      moldflow: 11,
      sink_mark: 10,
      ejection: 10,
      mic: 9,
      coating: 7,
      rear_back_beam: 6
    };
  }
}

module.exports = PreProductionChecklist;
