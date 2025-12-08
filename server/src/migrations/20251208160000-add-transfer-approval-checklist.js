'use strict';

/**
 * 이관 승인 시스템 및 체크리스트 연동 테이블 추가
 * - transfer_approvals: 이관 승인 (생산처, 개발담당, 이관처 3단계 승인)
 * - transfer_checklist_items: 이관 점검 항목 (체크리스트 마스터 연동)
 * - transfer_inspection_results: 이관 점검 결과
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // transfers 테이블 존재 여부 확인
    let transfersExists = false;
    try {
      const result = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transfers'"
      );
      transfersExists = result && result[0] && result[0].length > 0;
    } catch (e) {
      console.log('transfers 테이블 확인 실패:', e.message);
    }
    
    // 1. transfer_approvals (이관 승인 - 3단계 승인 시스템)
    // transfers 테이블이 없으면 FK 없이 생성
    await queryInterface.createTable('transfer_approvals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      transfer_id: {
        type: Sequelize.INTEGER,
        allowNull: false
        // FK는 transfers 테이블이 있을 때만 나중에 추가
      },
      // 승인 단계
      approval_stage: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'plant_approval (생산처), developer_approval (개발담당), receiver_approval (이관처)'
      },
      approval_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '승인 순서: 1=생산처, 2=개발담당, 3=이관처'
      },
      // 승인자 정보
      approver_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approver_name: {
        type: Sequelize.STRING(100)
      },
      approver_company: {
        type: Sequelize.STRING(200)
      },
      // 승인 상태
      approval_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'pending',
        comment: 'pending, approved, rejected, conditional'
      },
      approval_date: {
        type: Sequelize.DATE
      },
      // 승인 의견
      approval_comments: {
        type: Sequelize.TEXT
      },
      rejection_reason: {
        type: Sequelize.TEXT
      },
      conditions: {
        type: Sequelize.TEXT,
        comment: '조건부 승인 시 조건'
      },
      // 서명
      signature: {
        type: Sequelize.TEXT,
        comment: '전자서명 데이터'
      },
      signature_date: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('transfer_approvals', ['transfer_id']);
    await queryInterface.addIndex('transfer_approvals', ['approval_stage']);
    await queryInterface.addIndex('transfer_approvals', ['approval_status']);

    // 2. transfer_checklist_items (이관 점검 항목 마스터)
    await queryInterface.createTable('transfer_checklist_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // 카테고리
      category: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'fitting (습합), appearance (외관), cavity (캐비티), core (코어), hydraulic (유압장치), heater (히터)'
      },
      category_order: {
        type: Sequelize.INTEGER,
        comment: '카테고리 표시 순서'
      },
      // 항목 정보
      item_code: {
        type: Sequelize.STRING(20),
        unique: true
      },
      item_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '점검항목명'
      },
      item_description: {
        type: Sequelize.TEXT,
        comment: '점검내용 상세'
      },
      item_order: {
        type: Sequelize.INTEGER,
        comment: '항목 표시 순서'
      },
      // 점검 기준
      inspection_standard: {
        type: Sequelize.TEXT,
        comment: '점검 기준/방법'
      },
      pass_criteria: {
        type: Sequelize.TEXT,
        comment: '합격 기준'
      },
      // 결과 유형
      result_type: {
        type: Sequelize.STRING(20),
        defaultValue: 'checkbox',
        comment: 'checkbox, text, number, select'
      },
      result_options: {
        type: Sequelize.JSONB,
        comment: 'select 타입일 경우 선택 옵션'
      },
      // 필수 여부
      is_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      // 사진 필요 여부
      requires_photo: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      // 활성화 상태
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('transfer_checklist_items', ['category']);
    await queryInterface.addIndex('transfer_checklist_items', ['is_active']);

    // 3. transfer_inspection_results (이관 점검 결과)
    await queryInterface.createTable('transfer_inspection_results', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      transfer_id: {
        type: Sequelize.INTEGER,
        allowNull: false
        // FK는 transfers 테이블이 있을 때만 나중에 추가
      },
      checklist_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'transfer_checklist_items',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      // 점검 결과
      result: {
        type: Sequelize.STRING(20),
        comment: 'pass, fail, na (해당없음)'
      },
      result_value: {
        type: Sequelize.TEXT,
        comment: '결과값 (텍스트, 숫자 등)'
      },
      // 점검 내용
      inspection_notes: {
        type: Sequelize.TEXT
      },
      // 사진
      photos: {
        type: Sequelize.JSONB
      },
      // 점검자
      inspected_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      inspected_at: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('transfer_inspection_results', ['transfer_id']);
    await queryInterface.addIndex('transfer_inspection_results', ['checklist_item_id']);

    // 4. transfers 테이블에 추가 컬럼 (테이블이 존재할 때만)
    if (transfersExists) {
      try {
        await queryInterface.addColumn('transfers', 'from_company_id', {
          type: Sequelize.INTEGER,
          references: {
            model: 'companies',
            key: 'id'
          },
          comment: '인계 업체 ID'
        });

        await queryInterface.addColumn('transfers', 'to_company_id', {
          type: Sequelize.INTEGER,
          references: {
            model: 'companies',
            key: 'id'
          },
          comment: '인수 업체 ID'
        });

        await queryInterface.addColumn('transfers', 'developer_id', {
          type: Sequelize.INTEGER,
          references: {
            model: 'users',
            key: 'id'
          },
          comment: '개발담당자 ID'
        });

        await queryInterface.addColumn('transfers', 'mold_info_snapshot', {
          type: Sequelize.JSONB,
          comment: '이관 시점 금형 정보 스냅샷'
        });

        await queryInterface.addColumn('transfers', 'checklist_completed', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: '체크리스트 완료 여부'
        });

        await queryInterface.addColumn('transfers', 'all_approvals_completed', {
          type: Sequelize.BOOLEAN,
          defaultValue: false,
          comment: '모든 승인 완료 여부'
        });
      } catch (e) {
        console.log('transfers 테이블 컬럼 추가 스킵 (이미 존재하거나 테이블 없음):', e.message);
      }
    }

    // 5. 기본 체크리스트 항목 삽입
    await queryInterface.bulkInsert('transfer_checklist_items', [
      // 습합 (Fitting)
      { category: 'fitting', category_order: 1, item_code: 'FIT-001', item_name: '제품 BURR', item_description: 'BURR 발생부 습합개소 확인', item_order: 1, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // 외관 (Appearance)
      { category: 'appearance', category_order: 2, item_code: 'APP-001', item_name: 'EYE BOLT 체결부', item_description: '피치 마모 및 밀착상태 확인', item_order: 1, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      { category: 'appearance', category_order: 2, item_code: 'APP-002', item_name: '상,하 고정판 확인', item_description: '이물 및 녹 오염상태 확인', item_order: 2, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      { category: 'appearance', category_order: 2, item_code: 'APP-003', item_name: '냉각상태', item_description: '냉각호스 정리 및 오염상태 확인', item_order: 3, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // 캐비티 (Cavity)
      { category: 'cavity', category_order: 3, item_code: 'CAV-001', item_name: '표면 흠집,녹', item_description: '표면 흠 및 녹 발생상태 확인', item_order: 1, result_type: 'checkbox', is_required: true, requires_photo: true, is_active: true, created_at: new Date(), updated_at: new Date() },
      { category: 'cavity', category_order: 3, item_code: 'CAV-002', item_name: '파팅면 오염,탄화', item_description: '파팅면 오염 및 탄화수지 확인', item_order: 2, result_type: 'checkbox', is_required: true, requires_photo: true, is_active: true, created_at: new Date(), updated_at: new Date() },
      { category: 'cavity', category_order: 3, item_code: 'CAV-003', item_name: '파팅면 BURR', item_description: '파팅면 끝단 손으로 접촉 확인', item_order: 3, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // 코어 (Core)
      { category: 'core', category_order: 4, item_code: 'COR-001', item_name: '코어류 분해청소', item_description: '긁힘 상태확인 및 이물확인', item_order: 1, result_type: 'checkbox', is_required: true, requires_photo: true, is_active: true, created_at: new Date(), updated_at: new Date() },
      { category: 'core', category_order: 4, item_code: 'COR-002', item_name: '마모', item_description: '작동부 마모상태 점검', item_order: 2, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      { category: 'core', category_order: 4, item_code: 'COR-003', item_name: '작동유 윤활유', item_description: '작동유 윤활상태 확인', item_order: 3, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // 유압장치 (Hydraulic)
      { category: 'hydraulic', category_order: 5, item_code: 'HYD-001', item_name: '작동유 누유', item_description: '유압 배관 파손 확인', item_order: 1, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      { category: 'hydraulic', category_order: 5, item_code: 'HYD-002', item_name: '호스 및 배선정리', item_description: '호스,배선 정돈상태 확인', item_order: 2, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      
      // 히터 (Heater)
      { category: 'heater', category_order: 6, item_code: 'HTR-001', item_name: '히터단선 누전', item_description: '히터단선,누전확인[테스터기]', item_order: 1, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() },
      { category: 'heater', category_order: 6, item_code: 'HTR-002', item_name: '수지 누출', item_description: '수지 넘침 확인', item_order: 2, result_type: 'checkbox', is_required: true, requires_photo: false, is_active: true, created_at: new Date(), updated_at: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    // transfers 테이블 존재 여부 확인
    let transfersExists = false;
    try {
      const result = await queryInterface.sequelize.query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'transfers'"
      );
      transfersExists = result && result[0] && result[0].length > 0;
    } catch (e) {
      console.log('transfers 테이블 확인 실패:', e.message);
    }

    // 컬럼 제거 (테이블이 존재할 때만)
    if (transfersExists) {
      try {
        await queryInterface.removeColumn('transfers', 'from_company_id');
        await queryInterface.removeColumn('transfers', 'to_company_id');
        await queryInterface.removeColumn('transfers', 'developer_id');
        await queryInterface.removeColumn('transfers', 'mold_info_snapshot');
        await queryInterface.removeColumn('transfers', 'checklist_completed');
        await queryInterface.removeColumn('transfers', 'all_approvals_completed');
      } catch (e) {
        console.log('transfers 컬럼 제거 스킵:', e.message);
      }
    }

    // 테이블 제거
    await queryInterface.dropTable('transfer_inspection_results');
    await queryInterface.dropTable('transfer_checklist_items');
    await queryInterface.dropTable('transfer_approvals');
  }
};
