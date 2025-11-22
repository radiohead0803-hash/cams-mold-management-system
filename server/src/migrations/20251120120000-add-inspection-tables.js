'use strict';

/**
 * 점검 관리 테이블 추가
 * - daily_checks: 일상점검
 * - daily_check_items: 일상점검 항목
 * - check_item_master: 점검 항목 마스터
 * - check_guide_materials: 점검 가이드 자료
 * - inspections: 정기점검
 * - inspection_items: 정기점검 항목
 * - inspection_schedules: 점검 스케줄
 * - qr_scan_alerts: QR 스캔 알람
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. daily_checks (일상점검)
    await queryInterface.createTable('daily_checks', {
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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      check_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      shift: {
        type: Sequelize.STRING(20),
        comment: 'day, night'
      },
      current_shots: {
        type: Sequelize.INTEGER,
        comment: '점검 시점 타수'
      },
      production_quantity: {
        type: Sequelize.INTEGER,
        comment: '생산 수량'
      },
      gps_latitude: {
        type: Sequelize.DECIMAL(10, 8)
      },
      gps_longitude: {
        type: Sequelize.DECIMAL(11, 8)
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'in_progress',
        comment: 'in_progress, completed, approved'
      },
      overall_status: {
        type: Sequelize.STRING(20),
        comment: 'good, warning, bad'
      },
      notes: {
        type: Sequelize.TEXT
      },
      completed_at: {
        type: Sequelize.DATE
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

    await queryInterface.addIndex('daily_checks', ['mold_id']);
    await queryInterface.addIndex('daily_checks', ['check_date']);
    await queryInterface.addIndex('daily_checks', ['status']);

    // 2. check_item_master (점검 항목 마스터)
    await queryInterface.createTable('check_item_master', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      item_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      item_description: {
        type: Sequelize.TEXT
      },
      check_points: {
        type: Sequelize.JSONB,
        comment: '점검 포인트 배열'
      },
      guide_photos: {
        type: Sequelize.JSONB,
        comment: '가이드 사진'
      },
      guide_documents: {
        type: Sequelize.JSONB,
        comment: '가이드 문서'
      },
      guide_video_url: {
        type: Sequelize.STRING(500)
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      display_order: {
        type: Sequelize.INTEGER
      },
      active: {
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

    await queryInterface.addIndex('check_item_master', ['category']);
    await queryInterface.addIndex('check_item_master', ['active']);

    // 3. daily_check_items (일상점검 항목)
    await queryInterface.createTable('daily_check_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      check_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'daily_checks',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      item_master_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'check_item_master',
          key: 'id'
        }
      },
      category: {
        type: Sequelize.STRING(50)
      },
      item_name: {
        type: Sequelize.STRING(100)
      },
      item_description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.STRING(20),
        comment: '양호, 주의, 불량'
      },
      notes: {
        type: Sequelize.TEXT
      },
      photos: {
        type: Sequelize.JSONB,
        comment: '사진 [{url, caption, uploaded_at}]'
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      display_order: {
        type: Sequelize.INTEGER
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('daily_check_items', ['check_id']);
    await queryInterface.addIndex('daily_check_items', ['item_master_id']);

    // 4. check_guide_materials (점검 가이드 자료)
    await queryInterface.createTable('check_guide_materials', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      item_master_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'check_item_master',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      material_type: {
        type: Sequelize.STRING(20),
        comment: 'photo, document, video'
      },
      title: {
        type: Sequelize.STRING(200)
      },
      description: {
        type: Sequelize.TEXT
      },
      file_url: {
        type: Sequelize.STRING(500)
      },
      file_size: {
        type: Sequelize.INTEGER
      },
      mime_type: {
        type: Sequelize.STRING(100)
      },
      thumbnail_url: {
        type: Sequelize.STRING(500)
      },
      display_order: {
        type: Sequelize.INTEGER
      },
      active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
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
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('check_guide_materials', ['item_master_id']);
    await queryInterface.addIndex('check_guide_materials', ['material_type']);

    // 5. inspections (정기점검)
    await queryInterface.createTable('inspections', {
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
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      inspection_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: '20k, 50k, 80k, 100k'
      },
      inspection_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      current_shots: {
        type: Sequelize.INTEGER
      },
      gps_latitude: {
        type: Sequelize.DECIMAL(10, 8)
      },
      gps_longitude: {
        type: Sequelize.DECIMAL(11, 8)
      },
      cleaning_method: {
        type: Sequelize.STRING(100),
        comment: '세척제 종류'
      },
      cleaning_ratio: {
        type: Sequelize.STRING(100),
        comment: '희석 비율/온도'
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'in_progress',
        comment: 'in_progress, completed, approved'
      },
      overall_status: {
        type: Sequelize.STRING(20),
        comment: 'good, maintenance_needed, repair_needed'
      },
      notes: {
        type: Sequelize.TEXT
      },
      completed_at: {
        type: Sequelize.DATE
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

    await queryInterface.addIndex('inspections', ['mold_id']);
    await queryInterface.addIndex('inspections', ['inspection_type']);
    await queryInterface.addIndex('inspections', ['inspection_date']);
    await queryInterface.addIndex('inspections', ['status']);

    // 6. inspection_items (정기점검 항목)
    await queryInterface.createTable('inspection_items', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      inspection_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inspections',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      category: {
        type: Sequelize.STRING(50)
      },
      item_name: {
        type: Sequelize.STRING(100)
      },
      item_description: {
        type: Sequelize.TEXT
      },
      status: {
        type: Sequelize.STRING(20),
        comment: '양호, 정비 필요, 수리 필요'
      },
      notes: {
        type: Sequelize.TEXT
      },
      photos: {
        type: Sequelize.JSONB
      },
      is_required: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      display_order: {
        type: Sequelize.INTEGER
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('inspection_items', ['inspection_id']);

    // 7. inspection_schedules (점검 스케줄)
    await queryInterface.createTable('inspection_schedules', {
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
      schedule_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'daily, periodic'
      },
      inspection_type: {
        type: Sequelize.STRING(20),
        comment: '20k, 50k, 80k, 100k (정기점검용)'
      },
      scheduled_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      scheduled_shots: {
        type: Sequelize.INTEGER,
        comment: '예정 타수'
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      status: {
        type: Sequelize.STRING(20),
        defaultValue: 'scheduled',
        comment: 'scheduled, in_progress, completed, skipped'
      },
      alert_sent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      alert_sent_at: {
        type: Sequelize.DATE
      },
      completed_at: {
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

    await queryInterface.addIndex('inspection_schedules', ['mold_id']);
    await queryInterface.addIndex('inspection_schedules', ['scheduled_date']);
    await queryInterface.addIndex('inspection_schedules', ['status']);

    // 8. qr_scan_alerts (QR 스캔 알람)
    await queryInterface.createTable('qr_scan_alerts', {
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
      alert_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'inspection_due, maintenance_due, shot_threshold'
      },
      alert_level: {
        type: Sequelize.STRING(20),
        comment: 'info, warning, critical'
      },
      message: {
        type: Sequelize.TEXT
      },
      current_shots: {
        type: Sequelize.INTEGER
      },
      threshold_shots: {
        type: Sequelize.INTEGER
      },
      is_read: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      read_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
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

    await queryInterface.addIndex('qr_scan_alerts', ['mold_id']);
    await queryInterface.addIndex('qr_scan_alerts', ['alert_type']);
    await queryInterface.addIndex('qr_scan_alerts', ['is_read']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('qr_scan_alerts');
    await queryInterface.dropTable('inspection_schedules');
    await queryInterface.dropTable('inspection_items');
    await queryInterface.dropTable('inspections');
    await queryInterface.dropTable('check_guide_materials');
    await queryInterface.dropTable('daily_check_items');
    await queryInterface.dropTable('check_item_master');
    await queryInterface.dropTable('daily_checks');
  }
};
