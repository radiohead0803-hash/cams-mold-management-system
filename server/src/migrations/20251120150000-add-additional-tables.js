'use strict';

/**
 * 추가 관리 테이블
 * - shots: 타수 기록
 * - gps_locations: GPS 위치
 * - notifications: 알림
 * - mold_disposal: 금형 폐기
 * - disposal_approvals: 폐기 승인
 * - disposal_records: 폐기 기록
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. shots (타수 기록)
    await queryInterface.createTable('shots', {
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
        onDelete: 'CASCADE'
      },
      recorded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      recorded_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      shift: {
        type: Sequelize.STRING(20),
        comment: 'day, night'
      },
      previous_shots: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      current_shots: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      shots_increment: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      production_quantity: {
        type: Sequelize.INTEGER,
        comment: '생산 수량'
      },
      cavity_count: {
        type: Sequelize.INTEGER
      },
      defect_count: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      notes: {
        type: Sequelize.TEXT
      },
      source: {
        type: Sequelize.STRING(50),
        comment: 'daily_check, manual, auto_sync'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('shots', ['mold_id']);
    await queryInterface.addIndex('shots', ['recorded_date']);

    // 2. gps_locations (GPS 위치)
    await queryInterface.createTable('gps_locations', {
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
        onDelete: 'CASCADE'
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 8),
        allowNull: false
      },
      longitude: {
        type: Sequelize.DECIMAL(11, 8),
        allowNull: false
      },
      accuracy: {
        type: Sequelize.DECIMAL(10, 2),
        comment: '정확도 (미터)'
      },
      location_type: {
        type: Sequelize.STRING(50),
        comment: 'check, inspection, transfer, manual'
      },
      related_id: {
        type: Sequelize.INTEGER,
        comment: '관련 레코드 ID (check_id, inspection_id, etc)'
      },
      address: {
        type: Sequelize.STRING(500),
        comment: '역지오코딩 주소'
      },
      recorded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('gps_locations', ['mold_id']);
    await queryInterface.addIndex('gps_locations', ['recorded_at']);

    // 3. notifications (알림)
    await queryInterface.createTable('notifications', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      notification_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'inspection_due, repair_request, transfer_request, approval_needed, etc'
      },
      title: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      priority: {
        type: Sequelize.STRING(20),
        defaultValue: 'normal',
        comment: 'low, normal, high, urgent'
      },
      related_type: {
        type: Sequelize.STRING(50),
        comment: 'mold, check, inspection, repair, transfer'
      },
      related_id: {
        type: Sequelize.INTEGER,
        comment: '관련 레코드 ID'
      },
      action_url: {
        type: Sequelize.STRING(500),
        comment: '액션 URL'
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read_at: {
        type: Sequelize.DATE
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['is_read']);
    await queryInterface.addIndex('notifications', ['created_at']);

    // 4. mold_disposal (금형 폐기)
    await queryInterface.createTable('mold_disposal', {
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
      disposal_number: {
        type: Sequelize.STRING(50),
        unique: true
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
      disposal_reason: {
        type: Sequelize.STRING(50),
        comment: 'eol, damaged, obsolete, cost'
      },
      reason_description: {
        type: Sequelize.TEXT
      },
      final_shots: {
        type: Sequelize.INTEGER
      },
      mold_age_years: {
        type: Sequelize.DECIMAL(4, 1)
      },
      estimated_value: {
        type: Sequelize.DECIMAL(12, 2)
      },
      disposal_method: {
        type: Sequelize.STRING(50),
        comment: 'scrap, sell, donate, recycle'
      },
      disposal_cost: {
        type: Sequelize.DECIMAL(12, 2)
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'requested',
        comment: 'requested, under_review, approved, rejected, completed'
      },
      documents: {
        type: Sequelize.JSONB
      },
      photos: {
        type: Sequelize.JSONB
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

    await queryInterface.addIndex('mold_disposal', ['mold_id']);
    await queryInterface.addIndex('mold_disposal', ['status']);

    // 5. disposal_approvals (폐기 승인)
    await queryInterface.createTable('disposal_approvals', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      disposal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'mold_disposal',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      approver_role: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'plant_manager, hq_manager, finance, executive'
      },
      approver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      approval_status: {
        type: Sequelize.STRING(20),
        comment: 'pending, approved, rejected'
      },
      approval_date: {
        type: Sequelize.DATE
      },
      comments: {
        type: Sequelize.TEXT
      },
      sequence_order: {
        type: Sequelize.INTEGER,
        comment: '승인 순서'
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

    await queryInterface.addIndex('disposal_approvals', ['disposal_id']);

    // 6. disposal_records (폐기 기록)
    await queryInterface.createTable('disposal_records', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      disposal_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: {
          model: 'mold_disposal',
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
      disposal_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      disposal_location: {
        type: Sequelize.STRING(200)
      },
      disposal_company: {
        type: Sequelize.STRING(200),
        comment: '폐기 업체'
      },
      disposal_certificate: {
        type: Sequelize.STRING(500),
        comment: '폐기 증명서 URL'
      },
      actual_cost: {
        type: Sequelize.DECIMAL(12, 2)
      },
      salvage_value: {
        type: Sequelize.DECIMAL(12, 2),
        comment: '잔존 가치'
      },
      executed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      witness_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: '입회자'
      },
      photos: {
        type: Sequelize.JSONB,
        comment: '폐기 사진'
      },
      documents: {
        type: Sequelize.JSONB
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

    await queryInterface.addIndex('disposal_records', ['disposal_id']);
    await queryInterface.addIndex('disposal_records', ['mold_id']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('disposal_records');
    await queryInterface.dropTable('disposal_approvals');
    await queryInterface.dropTable('mold_disposal');
    await queryInterface.dropTable('notifications');
    await queryInterface.dropTable('gps_locations');
    await queryInterface.dropTable('shots');
  }
};
