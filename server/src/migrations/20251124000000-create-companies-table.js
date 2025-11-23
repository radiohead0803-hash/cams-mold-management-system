'use strict';

/**
 * 제작처/생산처 통합 관리 테이블 생성
 * company_type으로 구분: 'maker' (금형제작처), 'plant' (생산처)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // companies 테이블 생성
    await queryInterface.createTable('companies', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      company_code: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false,
        comment: '회사 코드 (예: MKR-001, PLT-001)'
      },
      company_name: {
        type: Sequelize.STRING(200),
        allowNull: false,
        comment: '회사명'
      },
      company_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'maker: 금형제작처, plant: 생산처'
      },
      // 기본 정보
      business_number: {
        type: Sequelize.STRING(50),
        comment: '사업자등록번호'
      },
      representative: {
        type: Sequelize.STRING(100),
        comment: '대표자명'
      },
      // 연락처 정보
      phone: {
        type: Sequelize.STRING(20),
        comment: '전화번호'
      },
      fax: {
        type: Sequelize.STRING(20),
        comment: '팩스번호'
      },
      email: {
        type: Sequelize.STRING(100),
        comment: '이메일'
      },
      // 주소 정보
      address: {
        type: Sequelize.STRING(500),
        comment: '주소'
      },
      address_detail: {
        type: Sequelize.STRING(200),
        comment: '상세주소'
      },
      postal_code: {
        type: Sequelize.STRING(20),
        comment: '우편번호'
      },
      // GPS 위치 (공장 위치)
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        comment: '위도'
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        comment: '경도'
      },
      // 담당자 정보
      manager_name: {
        type: Sequelize.STRING(100),
        comment: '담당자명'
      },
      manager_phone: {
        type: Sequelize.STRING(20),
        comment: '담당자 전화번호'
      },
      manager_email: {
        type: Sequelize.STRING(100),
        comment: '담당자 이메일'
      },
      // 계약 정보
      contract_start_date: {
        type: Sequelize.DATEONLY,
        comment: '계약 시작일'
      },
      contract_end_date: {
        type: Sequelize.DATEONLY,
        comment: '계약 종료일'
      },
      contract_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'active',
        comment: 'active: 활성, expired: 만료, suspended: 중지'
      },
      // 평가 정보
      rating: {
        type: Sequelize.DECIMAL(3, 2),
        comment: '평가 점수 (0.00 ~ 5.00)'
      },
      quality_score: {
        type: Sequelize.DECIMAL(5, 2),
        comment: '품질 점수 (0 ~ 100)'
      },
      delivery_score: {
        type: Sequelize.DECIMAL(5, 2),
        comment: '납기 점수 (0 ~ 100)'
      },
      // 능력 정보 (제작처 전용)
      production_capacity: {
        type: Sequelize.INTEGER,
        comment: '생산 능력 (월간 금형 제작 수)'
      },
      equipment_list: {
        type: Sequelize.JSONB,
        comment: '보유 장비 목록'
      },
      certifications: {
        type: Sequelize.JSONB,
        comment: '인증 목록 (ISO, 품질인증 등)'
      },
      specialties: {
        type: Sequelize.JSONB,
        comment: '전문 분야 (사출금형, 프레스금형 등)'
      },
      // 생산 정보 (생산처 전용)
      production_lines: {
        type: Sequelize.INTEGER,
        comment: '생산 라인 수'
      },
      injection_machines: {
        type: Sequelize.JSONB,
        comment: '사출기 목록 [{machine_name, tonnage, manufacturer}]'
      },
      daily_capacity: {
        type: Sequelize.INTEGER,
        comment: '일일 생산 능력 (개)'
      },
      // 통계 정보
      total_molds: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '총 금형 수'
      },
      active_molds: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '활성 금형 수'
      },
      completed_projects: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '완료된 프로젝트 수'
      },
      // 비고
      notes: {
        type: Sequelize.TEXT,
        comment: '비고'
      },
      // 상태
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: '활성 상태'
      },
      // 등록 정보
      registered_by: {
        type: Sequelize.INTEGER,
        comment: '등록자 ID (users.id)'
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    // 인덱스 생성
    await queryInterface.addIndex('companies', ['company_code'], {
      name: 'idx_companies_code'
    });
    await queryInterface.addIndex('companies', ['company_type'], {
      name: 'idx_companies_type'
    });
    await queryInterface.addIndex('companies', ['company_name'], {
      name: 'idx_companies_name'
    });
    await queryInterface.addIndex('companies', ['is_active'], {
      name: 'idx_companies_active'
    });
    await queryInterface.addIndex('companies', ['contract_status'], {
      name: 'idx_companies_contract_status'
    });

    // users 테이블에 company_id 외래키 추가 (이미 존재하면 스킵)
    const usersTable = await queryInterface.describeTable('users');
    if (!usersTable.company_id) {
      await queryInterface.addColumn('users', 'company_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      });
      
      await queryInterface.addIndex('users', ['company_id'], {
        name: 'idx_users_company_id'
      });
    }

    // molds 테이블의 maker_id, plant_id를 companies 테이블 참조로 변경
    const moldsTable = await queryInterface.describeTable('molds');
    
    // maker_company_id 컬럼 추가
    if (!moldsTable.maker_company_id) {
      await queryInterface.addColumn('molds', 'maker_company_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '제작처 회사 ID'
      });
      
      await queryInterface.addIndex('molds', ['maker_company_id'], {
        name: 'idx_molds_maker_company'
      });
    }

    // plant_company_id 컬럼 추가
    if (!moldsTable.plant_company_id) {
      await queryInterface.addColumn('molds', 'plant_company_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '생산처 회사 ID'
      });
      
      await queryInterface.addIndex('molds', ['plant_company_id'], {
        name: 'idx_molds_plant_company'
      });
    }

    // mold_specifications 테이블에 maker_company_id 추가
    const moldSpecsTable = await queryInterface.describeTable('mold_specifications');
    if (!moldSpecsTable.maker_company_id) {
      await queryInterface.addColumn('mold_specifications', 'maker_company_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '제작처 회사 ID'
      });
      
      await queryInterface.addIndex('mold_specifications', ['maker_company_id'], {
        name: 'idx_mold_specs_maker_company'
      });
    }

    // plant_company_id 추가
    if (!moldSpecsTable.plant_company_id) {
      await queryInterface.addColumn('mold_specifications', 'plant_company_id', {
        type: Sequelize.INTEGER,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '생산처 회사 ID'
      });
      
      await queryInterface.addIndex('mold_specifications', ['plant_company_id'], {
        name: 'idx_mold_specs_plant_company'
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // 인덱스 삭제
    await queryInterface.removeIndex('mold_specifications', 'idx_mold_specs_plant_company');
    await queryInterface.removeIndex('mold_specifications', 'idx_mold_specs_maker_company');
    await queryInterface.removeIndex('molds', 'idx_molds_plant_company');
    await queryInterface.removeIndex('molds', 'idx_molds_maker_company');
    await queryInterface.removeIndex('users', 'idx_users_company_id');
    
    // 컬럼 삭제
    await queryInterface.removeColumn('mold_specifications', 'plant_company_id');
    await queryInterface.removeColumn('mold_specifications', 'maker_company_id');
    await queryInterface.removeColumn('molds', 'plant_company_id');
    await queryInterface.removeColumn('molds', 'maker_company_id');
    await queryInterface.removeColumn('users', 'company_id');
    
    // 인덱스 삭제
    await queryInterface.removeIndex('companies', 'idx_companies_contract_status');
    await queryInterface.removeIndex('companies', 'idx_companies_active');
    await queryInterface.removeIndex('companies', 'idx_companies_name');
    await queryInterface.removeIndex('companies', 'idx_companies_type');
    await queryInterface.removeIndex('companies', 'idx_companies_code');
    
    // 테이블 삭제
    await queryInterface.dropTable('companies');
  }
};
