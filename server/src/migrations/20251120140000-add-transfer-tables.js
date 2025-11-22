'use strict';

/**
 * 이관 관리 테이블 추가
 * - transfers: 이관요청
 * - transfer_4m: 4M 준비
 * - transfer_confirmation: 이관확인
 * - transfer_history: 이관이력
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. transfers (이관요청)
    await queryInterface.createTable('transfers', {
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
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT'
      },
      transfer_number: {
        type: Sequelize.STRING(50),
        unique: true,
        comment: '이관번호'
      },
      transfer_type: {
        type: Sequelize.STRING(50),
        comment: 'maker_to_plant, plant_to_plant, plant_to_storage'
      },
      from_location: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      to_location: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      from_party_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: '이관 출발지 담당자'
      },
      to_party_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: '이관 도착지 담당자'
      },
      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      request_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      planned_transfer_date: {
        type: Sequelize.DATEONLY
      },
      actual_transfer_date: {
        type: Sequelize.DATEONLY
      },
      reason: {
        type: Sequelize.TEXT,
        comment: '이관 사유'
      },
      current_shots: {
        type: Sequelize.INTEGER
      },
      mold_condition: {
        type: Sequelize.STRING(50),
        comment: 'excellent, good, fair, poor'
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'requested',
        comment: 'requested, 4m_preparation, ready_to_ship, in_transit, delivered, confirmed, rejected'
      },
      documents: {
        type: Sequelize.JSONB,
        comment: '이관 문서'
      },
      photos: {
        type: Sequelize.JSONB,
        comment: '이관 전 사진'
      },
      approved_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approved_at: {
        type: Sequelize.DATE
      },
      shipped_at: {
        type: Sequelize.DATE
      },
      delivered_at: {
        type: Sequelize.DATE
      },
      confirmed_at: {
        type: Sequelize.DATE
      },
      notes: {
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('transfers', ['mold_id']);
    await queryInterface.addIndex('transfers', ['transfer_number']);
    await queryInterface.addIndex('transfers', ['status']);
    await queryInterface.addIndex('transfers', ['request_date']);

    // 2. transfer_4m (4M 준비)
    await queryInterface.createTable('transfer_4m', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      transfer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'transfers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      // Man (인력)
      man_prepared: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      man_operator_trained: {
        type: Sequelize.BOOLEAN
      },
      man_supervisor_assigned: {
        type: Sequelize.BOOLEAN
      },
      man_notes: {
        type: Sequelize.TEXT
      },
      // Machine (설비)
      machine_prepared: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      machine_type: {
        type: Sequelize.STRING(100)
      },
      machine_tonnage: {
        type: Sequelize.INTEGER
      },
      machine_availability: {
        type: Sequelize.BOOLEAN
      },
      machine_notes: {
        type: Sequelize.TEXT
      },
      // Material (자재)
      material_prepared: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      material_resin_type: {
        type: Sequelize.STRING(100)
      },
      material_quantity: {
        type: Sequelize.DECIMAL(10, 2)
      },
      material_supplier: {
        type: Sequelize.STRING(200)
      },
      material_notes: {
        type: Sequelize.TEXT
      },
      // Method (방법)
      method_prepared: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      method_process_sheet: {
        type: Sequelize.BOOLEAN
      },
      method_quality_plan: {
        type: Sequelize.BOOLEAN
      },
      method_work_instruction: {
        type: Sequelize.BOOLEAN
      },
      method_notes: {
        type: Sequelize.TEXT
      },
      // 전체 상태
      overall_status: {
        type: Sequelize.STRING(20),
        defaultValue: 'in_preparation',
        comment: 'in_preparation, ready, incomplete'
      },
      documents: {
        type: Sequelize.JSONB,
        comment: '4M 관련 문서'
      },
      prepared_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      prepared_at: {
        type: Sequelize.DATE
      },
      verified_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      verified_at: {
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

    await queryInterface.addIndex('transfer_4m', ['transfer_id']);

    // 3. transfer_confirmation (이관확인)
    await queryInterface.createTable('transfer_confirmation', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      transfer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'transfers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      confirmed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      confirmed_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      // 금형 상태 확인
      mold_condition_check: {
        type: Sequelize.STRING(20),
        comment: 'good, damaged, needs_repair'
      },
      external_damage: {
        type: Sequelize.BOOLEAN
      },
      internal_damage: {
        type: Sequelize.BOOLEAN
      },
      completeness_check: {
        type: Sequelize.BOOLEAN,
        comment: '부속품 완전성'
      },
      // 문서 확인
      documents_received: {
        type: Sequelize.BOOLEAN
      },
      documents_complete: {
        type: Sequelize.BOOLEAN
      },
      drawings_received: {
        type: Sequelize.BOOLEAN
      },
      // 시운전
      trial_run_performed: {
        type: Sequelize.BOOLEAN
      },
      trial_run_result: {
        type: Sequelize.STRING(20),
        comment: 'pass, fail, conditional'
      },
      trial_run_shots: {
        type: Sequelize.INTEGER
      },
      trial_run_notes: {
        type: Sequelize.TEXT
      },
      // 최종 확인
      acceptance_status: {
        type: Sequelize.STRING(20),
        comment: 'accepted, rejected, conditional'
      },
      rejection_reason: {
        type: Sequelize.TEXT
      },
      conditions: {
        type: Sequelize.TEXT,
        comment: '조건부 승인 조건'
      },
      photos: {
        type: Sequelize.JSONB,
        comment: '이관 후 사진'
      },
      signature: {
        type: Sequelize.TEXT,
        comment: '전자서명'
      },
      notes: {
        type: Sequelize.TEXT
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

    await queryInterface.addIndex('transfer_confirmation', ['transfer_id']);

    // 4. transfer_history (이관이력)
    await queryInterface.createTable('transfer_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      transfer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'transfers',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mold_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'molds',
          key: 'id'
        }
      },
      action_type: {
        type: Sequelize.STRING(50),
        comment: 'status_change, 4m_updated, document_uploaded, etc'
      },
      action_description: {
        type: Sequelize.TEXT
      },
      old_status: {
        type: Sequelize.STRING(20)
      },
      new_status: {
        type: Sequelize.STRING(20)
      },
      performed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      performed_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      metadata: {
        type: Sequelize.JSONB
      }
    });

    await queryInterface.addIndex('transfer_history', ['transfer_id']);
    await queryInterface.addIndex('transfer_history', ['mold_id']);
    await queryInterface.addIndex('transfer_history', ['performed_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('transfer_history');
    await queryInterface.dropTable('transfer_confirmation');
    await queryInterface.dropTable('transfer_4m');
    await queryInterface.dropTable('transfers');
  }
};
