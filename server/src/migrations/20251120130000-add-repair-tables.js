'use strict';

/**
 * 수리 관리 테이블 추가
 * - repairs: 수리요청
 * - repair_liability: 귀책협의
 * - repair_history: 수리이력
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. repairs (수리요청)
    await queryInterface.createTable('repairs', {
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
      request_number: {
        type: Sequelize.STRING(50),
        unique: true,
        comment: '수리요청번호'
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
      issue_type: {
        type: Sequelize.STRING(50),
        comment: 'crack, wear, deformation, malfunction, etc'
      },
      issue_description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      severity: {
        type: Sequelize.STRING(20),
        comment: 'low, medium, high, critical'
      },
      current_shots: {
        type: Sequelize.INTEGER
      },
      photos: {
        type: Sequelize.JSONB,
        comment: '이슈 사진'
      },
      documents: {
        type: Sequelize.JSONB,
        comment: '관련 문서'
      },
      estimated_cost: {
        type: Sequelize.DECIMAL(12, 2)
      },
      estimated_days: {
        type: Sequelize.INTEGER,
        comment: '예상 소요일'
      },
      target_completion_date: {
        type: Sequelize.DATEONLY
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'requested',
        comment: 'requested, liability_review, approved, in_repair, completed, rejected'
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: '담당 수리업체'
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
      started_at: {
        type: Sequelize.DATE
      },
      completed_at: {
        type: Sequelize.DATE
      },
      actual_cost: {
        type: Sequelize.DECIMAL(12, 2)
      },
      actual_days: {
        type: Sequelize.INTEGER
      },
      completion_notes: {
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

    await queryInterface.addIndex('repairs', ['mold_id']);
    await queryInterface.addIndex('repairs', ['request_number']);
    await queryInterface.addIndex('repairs', ['status']);
    await queryInterface.addIndex('repairs', ['request_date']);

    // 2. repair_liability (귀책협의)
    await queryInterface.createTable('repair_liability', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      repair_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'repairs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      review_number: {
        type: Sequelize.STRING(50),
        unique: true
      },
      initiated_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      initiated_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      issue_cause: {
        type: Sequelize.TEXT,
        comment: '이슈 원인 분석'
      },
      liability_party: {
        type: Sequelize.STRING(50),
        comment: 'hq, maker, plant, supplier, unknown'
      },
      liability_percentage: {
        type: Sequelize.INTEGER,
        comment: '귀책 비율 (%)'
      },
      cost_allocation: {
        type: Sequelize.JSONB,
        comment: '비용 분담 [{party, amount, percentage}]'
      },
      evidence_documents: {
        type: Sequelize.JSONB,
        comment: '증빙 문서'
      },
      evidence_photos: {
        type: Sequelize.JSONB,
        comment: '증빙 사진'
      },
      discussion_notes: {
        type: Sequelize.TEXT,
        comment: '협의 내용'
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'under_review',
        comment: 'under_review, agreed, disputed, resolved'
      },
      hq_approval: {
        type: Sequelize.BOOLEAN
      },
      hq_approved_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      hq_approved_at: {
        type: Sequelize.DATE
      },
      maker_approval: {
        type: Sequelize.BOOLEAN
      },
      maker_approved_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      maker_approved_at: {
        type: Sequelize.DATE
      },
      plant_approval: {
        type: Sequelize.BOOLEAN
      },
      plant_approved_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      plant_approved_at: {
        type: Sequelize.DATE
      },
      final_decision: {
        type: Sequelize.TEXT
      },
      resolved_at: {
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

    await queryInterface.addIndex('repair_liability', ['repair_id']);
    await queryInterface.addIndex('repair_liability', ['status']);

    // 3. repair_history (수리이력)
    await queryInterface.createTable('repair_history', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      repair_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'repairs',
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
        comment: 'status_change, comment_added, document_uploaded, etc'
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
        type: Sequelize.JSONB,
        comment: '추가 메타데이터'
      }
    });

    await queryInterface.addIndex('repair_history', ['repair_id']);
    await queryInterface.addIndex('repair_history', ['mold_id']);
    await queryInterface.addIndex('repair_history', ['performed_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('repair_history');
    await queryInterface.dropTable('repair_liability');
    await queryInterface.dropTable('repairs');
  }
};
