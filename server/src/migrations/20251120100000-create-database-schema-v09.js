'use strict';

/**
 * DATABASE_SCHEMA.md Ver.09 기준 정확한 마이그레이션
 * 본사 → 제작처 → 협력사 마스터 개념 구현
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ============================================
    // 1. 사용자 및 권한 (2개)
    // ============================================
    
    // 1.1 users (사용자)
    const [usersReg] = await queryInterface.sequelize.query("SELECT to_regclass('public.users') as t");
    const usersExists = !!usersReg[0].t;
    if (!usersExists) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(100)
      },
      phone: {
        type: Sequelize.STRING(20)
      },
      role_group: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'hq, plant, maker'
      },
      role_detail: {
        type: Sequelize.STRING(50)
      },
      plant_id: {
        type: Sequelize.INTEGER
      },
      maker_id: {
        type: Sequelize.INTEGER
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      last_login: {
        type: Sequelize.DATE
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
    }

    // Add indexes for users if not already present
    const usersIndexes = await queryInterface.showIndex('users');
    const hasUserIdx = (n) => usersIndexes?.some((idx) => idx.name === n);
    if (!hasUserIdx('idx_users_role_group')) {
      await queryInterface.addIndex('users', ['role_group'], { name: 'idx_users_role_group' });
    }
    if (!hasUserIdx('idx_users_plant_id')) {
      await queryInterface.addIndex('users', ['plant_id'], { name: 'idx_users_plant_id' });
    }
    if (!hasUserIdx('idx_users_maker_id')) {
      await queryInterface.addIndex('users', ['maker_id'], { name: 'idx_users_maker_id' });
    }

    // ============================================
    // 3. 금형정보 관리 - 금형 마스터
    // ============================================
    
    // 3.1 molds (금형 마스터)
    const [moldsReg] = await queryInterface.sequelize.query("SELECT to_regclass('public.molds') as t");
    const moldsExists = !!moldsReg[0].t;
    if (!moldsExists) {
    await queryInterface.createTable('molds', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      mold_code: {
        type: Sequelize.STRING(50),
        unique: true,
        allowNull: false
      },
      mold_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      car_model: {
        type: Sequelize.STRING(100)
      },
      part_name: {
        type: Sequelize.STRING(200)
      },
      cavity: {
        type: Sequelize.INTEGER
      },
      plant_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      maker_id: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      qr_token: {
        type: Sequelize.STRING(255),
        unique: true
      },
      sop_date: {
        type: Sequelize.DATEONLY
      },
      eop_date: {
        type: Sequelize.DATEONLY
      },
      target_shots: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'active',
        comment: 'active, repair, transfer, idle, scrapped'
      },
      location: {
        type: Sequelize.STRING(200)
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
    }

    // Add indexes for molds if they do not already exist
    const moldsIndexes = await queryInterface.showIndex('molds');
    const hasIdx = (n) => moldsIndexes?.some((idx) => idx.name === n);
    if (!hasIdx('idx_molds_plant')) {
      await queryInterface.addIndex('molds', ['plant_id'], { name: 'idx_molds_plant' });
    }
    if (!hasIdx('idx_molds_maker')) {
      await queryInterface.addIndex('molds', ['maker_id'], { name: 'idx_molds_maker' });
    }
    if (!hasIdx('idx_molds_qr_token')) {
      await queryInterface.addIndex('molds', ['qr_token'], { name: 'idx_molds_qr_token' });
    }
    if (!hasIdx('idx_molds_status')) {
      await queryInterface.addIndex('molds', ['status'], { name: 'idx_molds_status' });
    }

    // ============================================
    // 2. 데이터 흐름 및 자동 연동 (4개)
    // ============================================
    
    // 2.1 mold_specifications (본사 금형제작사양 - 1차 입력)
    // Create table only if it does not exist
    const [msReg] = await queryInterface.sequelize.query("SELECT to_regclass('public.mold_specifications') as t");
    const msExists = !!msReg[0].t;
    if (!msExists) {
      await queryInterface.createTable('mold_specifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      // 기본 정보 (외부 시스템 연동 가능)
      part_number: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      part_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      car_model: {
        type: Sequelize.STRING(100)
      },
      car_year: {
        type: Sequelize.STRING(10)
      },
      // 금형 사양
      mold_type: {
        type: Sequelize.STRING(50)
      },
      cavity_count: {
        type: Sequelize.INTEGER
      },
      material: {
        type: Sequelize.STRING(100)
      },
      tonnage: {
        type: Sequelize.INTEGER
      },
      // 제작 정보
      target_maker_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      development_stage: {
        type: Sequelize.STRING(20),
        comment: '개발, 양산'
      },
      production_stage: {
        type: Sequelize.STRING(20)
      },
      // 제작 일정
      order_date: {
        type: Sequelize.DATEONLY
      },
      target_delivery_date: {
        type: Sequelize.DATEONLY
      },
      actual_delivery_date: {
        type: Sequelize.DATEONLY
      },
      // 예산
      estimated_cost: {
        type: Sequelize.DECIMAL(12, 2)
      },
      actual_cost: {
        type: Sequelize.DECIMAL(12, 2)
      },
      // 상태
      status: {
        type: Sequelize.STRING(20),
        comment: 'draft, sent_to_maker, in_production, completed'
      },
      // 외부 시스템 연동
      external_system_id: {
        type: Sequelize.STRING(100),
        comment: '부품정보 시스템 ID'
      },
      external_sync_enabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      last_sync_date: {
        type: Sequelize.DATE
      },
      // 연동 정보
      mold_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'molds',
          key: 'id'
        }
      },
      created_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
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
    }

    // Add indexes for mold_specifications if columns exist and index missing
    const msIndexes = await queryInterface.showIndex('mold_specifications');
    const hasMsIdx = (n) => msIndexes?.some((idx) => idx.name === n);
    const msCols = await queryInterface.describeTable('mold_specifications');
    if (msCols.part_number && !hasMsIdx('idx_mold_specifications_part')) {
      await queryInterface.addIndex('mold_specifications', ['part_number'], { name: 'idx_mold_specifications_part' });
    }
    if (msCols.target_maker_id && !hasMsIdx('idx_mold_specifications_maker')) {
      await queryInterface.addIndex('mold_specifications', ['target_maker_id'], { name: 'idx_mold_specifications_maker' });
    }
    if (msCols.external_system_id && !hasMsIdx('idx_mold_specifications_external')) {
      await queryInterface.addIndex('mold_specifications', ['external_system_id'], { name: 'idx_mold_specifications_external' });
    }
    if (msCols.status && !hasMsIdx('idx_mold_specifications_status')) {
      await queryInterface.addIndex('mold_specifications', ['status'], { name: 'idx_mold_specifications_status' });
    }

    // 2.2 maker_specifications (제작처 사양 - 자동 연동 + 추가 입력)
    const [mkReg] = await queryInterface.sequelize.query("SELECT to_regclass('public.maker_specifications') as t");
    const mkExists = !!mkReg[0].t;
    if (!mkExists) {
    await queryInterface.createTable('maker_specifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      specification_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'mold_specifications',
          key: 'id'
        }
      },
      maker_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      // 본사 입력 항목 (읽기 전용, 자동 연동)
      part_number: {
        type: Sequelize.STRING(50)
      },
      part_name: {
        type: Sequelize.STRING(200)
      },
      car_model: {
        type: Sequelize.STRING(100)
      },
      mold_type: {
        type: Sequelize.STRING(50)
      },
      cavity_count: {
        type: Sequelize.INTEGER
      },
      material: {
        type: Sequelize.STRING(100)
      },
      tonnage: {
        type: Sequelize.INTEGER
      },
      development_stage: {
        type: Sequelize.STRING(20)
      },
      // 제작처 입력 항목
      actual_material: {
        type: Sequelize.STRING(100)
      },
      actual_cavity_count: {
        type: Sequelize.INTEGER
      },
      core_material: {
        type: Sequelize.STRING(100)
      },
      cavity_material: {
        type: Sequelize.STRING(100)
      },
      hardness: {
        type: Sequelize.STRING(50)
      },
      // 구조 정보
      cooling_type: {
        type: Sequelize.STRING(50)
      },
      ejection_type: {
        type: Sequelize.STRING(50)
      },
      hot_runner: {
        type: Sequelize.BOOLEAN
      },
      slide_count: {
        type: Sequelize.INTEGER
      },
      lifter_count: {
        type: Sequelize.INTEGER
      },
      // 성능 정보
      cycle_time: {
        type: Sequelize.INTEGER,
        comment: '초'
      },
      max_shots: {
        type: Sequelize.INTEGER
      },
      // 제작 진행
      production_progress: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '0-100%'
      },
      current_stage: {
        type: Sequelize.STRING(50)
      },
      // 도면 및 사진
      drawings: {
        type: Sequelize.JSONB,
        comment: '도면 URL 배열'
      },
      production_images: {
        type: Sequelize.JSONB,
        comment: '제작 과정 사진'
      },
      // 완료 정보
      completed: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      completed_date: {
        type: Sequelize.DATEONLY
      },
      // 상태
      status: {
        type: Sequelize.STRING(20),
        comment: 'pending, in_progress, completed'
      },
      // 연동 정보
      synced_from_hq: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      synced_at: {
        type: Sequelize.DATE
      },
      // 기타
      notes: {
        type: Sequelize.TEXT
      },
      specifications: {
        type: Sequelize.JSONB,
        comment: '상세 사양'
      },
      updated_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
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
    }

    const mkIndexes = await queryInterface.showIndex('maker_specifications');
    const hasMkIdx = (n) => mkIndexes?.some((idx) => idx.name === n);
    if (!hasMkIdx('idx_maker_specifications_spec')) {
      await queryInterface.addIndex('maker_specifications', ['specification_id'], { name: 'idx_maker_specifications_spec' });
    }
    if (!hasMkIdx('idx_maker_specifications_maker')) {
      await queryInterface.addIndex('maker_specifications', ['maker_id'], { name: 'idx_maker_specifications_maker' });
    }
    if (!hasMkIdx('idx_maker_specifications_status')) {
      await queryInterface.addIndex('maker_specifications', ['status'], { name: 'idx_maker_specifications_status' });
    }

    // 2.3 plant_molds (생산처 금형 - 자동 연동)
    const [pmReg] = await queryInterface.sequelize.query("SELECT to_regclass('public.plant_molds') as t");
    const pmExists = !!pmReg[0].t;
    if (!pmExists) {
    await queryInterface.createTable('plant_molds', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      mold_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'molds',
          key: 'id'
        }
      },
      plant_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      // 금형 마스터 정보 (읽기 전용, 자동 연동)
      mold_code: {
        type: Sequelize.STRING(50)
      },
      mold_name: {
        type: Sequelize.STRING(200)
      },
      part_number: {
        type: Sequelize.STRING(50)
      },
      part_name: {
        type: Sequelize.STRING(200)
      },
      car_model: {
        type: Sequelize.STRING(100)
      },
      cavity: {
        type: Sequelize.INTEGER
      },
      target_shots: {
        type: Sequelize.INTEGER
      },
      // 생산처 입력 항목
      current_shots: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      production_quantity: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      production_line: {
        type: Sequelize.STRING(100)
      },
      injection_machine: {
        type: Sequelize.STRING(100)
      },
      // 사출 조건
      injection_conditions: {
        type: Sequelize.JSONB
      },
      // 상태
      status: {
        type: Sequelize.STRING(20),
        comment: 'assigned, in_production, maintenance, idle'
      },
      assigned_date: {
        type: Sequelize.DATEONLY
      },
      last_production_date: {
        type: Sequelize.DATEONLY
      },
      // 연동 정보
      synced_from_master: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      synced_to_master: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      synced_at: {
        type: Sequelize.DATE
      },
      last_sync_date: {
        type: Sequelize.DATE
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
    }

    const pmIndexes = await queryInterface.showIndex('plant_molds');
    const hasPmIdx = (n) => pmIndexes?.some((idx) => idx.name === n);
    if (!hasPmIdx('idx_plant_molds_mold')) {
      await queryInterface.addIndex('plant_molds', ['mold_id'], { name: 'idx_plant_molds_mold' });
    }
    if (!hasPmIdx('idx_plant_molds_plant')) {
      await queryInterface.addIndex('plant_molds', ['plant_id'], { name: 'idx_plant_molds_plant' });
    }
    if (!hasPmIdx('idx_plant_molds_status')) {
      await queryInterface.addIndex('plant_molds', ['status'], { name: 'idx_plant_molds_status' });
    }

    // 2.4 stage_change_history (단계 변경 이력)
    const [stReg] = await queryInterface.sequelize.query("SELECT to_regclass('public.stage_change_history') as t");
    const stExists = !!stReg[0].t;
    if (!stExists) {
    await queryInterface.createTable('stage_change_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      mold_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'molds',
          key: 'id'
        }
      },
      previous_stage: {
        type: Sequelize.STRING(20)
      },
      new_stage: {
        type: Sequelize.STRING(20)
      },
      change_type: {
        type: Sequelize.STRING(20),
        comment: 'development, production'
      },
      reason: {
        type: Sequelize.TEXT
      },
      changed_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      changed_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
    }

    const stIndexes = await queryInterface.showIndex('stage_change_history');
    const hasStIdx = (n) => stIndexes?.some((idx) => idx.name === n);
    if (!hasStIdx('idx_stage_change_mold')) {
      await queryInterface.addIndex('stage_change_history', ['mold_id'], { name: 'idx_stage_change_mold' });
    }
    if (!hasStIdx('idx_stage_change_date')) {
      await queryInterface.addIndex('stage_change_history', ['changed_at'], { name: 'idx_stage_change_date' });
    }

    // 1.2 qr_sessions (QR 세션)
    const [qrReg] = await queryInterface.sequelize.query("SELECT to_regclass('public.qr_sessions') as t");
    const qrExists = !!qrReg[0].t;
    if (!qrExists) {
    await queryInterface.createTable('qr_sessions', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      session_token: {
        type: Sequelize.STRING(255),
        unique: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      mold_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'molds',
          key: 'id'
        }
      },
      expires_at: {
        type: Sequelize.DATE,
        allowNull: false
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      }
    });
    }

    const qrIndexes = await queryInterface.showIndex('qr_sessions');
    const hasQrIdx = (n) => qrIndexes?.some((idx) => idx.name === n);
    if (!hasQrIdx('idx_qr_sessions_token')) {
      await queryInterface.addIndex('qr_sessions', ['session_token'], { name: 'idx_qr_sessions_token' });
    }
    if (!hasQrIdx('idx_qr_sessions_user')) {
      await queryInterface.addIndex('qr_sessions', ['user_id'], { name: 'idx_qr_sessions_user' });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('qr_sessions');
    await queryInterface.dropTable('stage_change_history');
    await queryInterface.dropTable('plant_molds');
    await queryInterface.dropTable('maker_specifications');
    await queryInterface.dropTable('mold_specifications');
    await queryInterface.dropTable('molds');
    await queryInterface.dropTable('users');
  }
};
