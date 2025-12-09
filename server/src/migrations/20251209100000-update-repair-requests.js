'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 컬럼 존재 여부 확인 함수
    const columnExists = async (table, column) => {
      try {
        const result = await queryInterface.sequelize.query(
          `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}'`
        );
        return result[0] && result[0].length > 0;
      } catch (e) {
        return false;
      }
    };

    // 추가할 컬럼 목록
    const columnsToAdd = [
      { name: 'request_number', type: Sequelize.STRING(50), allowNull: true },
      { name: 'mold_spec_id', type: Sequelize.BIGINT, allowNull: true },
      { name: 'severity', type: Sequelize.STRING(20), allowNull: true, defaultValue: 'medium' },
      { name: 'urgency', type: Sequelize.STRING(20), allowNull: true, defaultValue: 'normal' },
      { name: 'issue_type', type: Sequelize.STRING(50), allowNull: true },
      { name: 'issue_description', type: Sequelize.TEXT, allowNull: true },
      { name: 'ng_type', type: Sequelize.STRING(50), allowNull: true },
      { name: 'requester_id', type: Sequelize.BIGINT, allowNull: true },
      { name: 'requester_company_id', type: Sequelize.BIGINT, allowNull: true },
      { name: 'requested_at', type: Sequelize.DATE, allowNull: true },
      { name: 'estimated_cost', type: Sequelize.DECIMAL(15, 2), allowNull: true },
      { name: 'actual_cost', type: Sequelize.DECIMAL(15, 2), allowNull: true },
      { name: 'blame_party', type: Sequelize.STRING(20), allowNull: true },
      { name: 'blame_percentage', type: Sequelize.INTEGER, allowNull: true },
      { name: 'blame_reason', type: Sequelize.TEXT, allowNull: true },
      { name: 'blame_confirmed', type: Sequelize.BOOLEAN, allowNull: true, defaultValue: false },
      { name: 'blame_confirmed_by', type: Sequelize.BIGINT, allowNull: true },
      { name: 'blame_confirmed_at', type: Sequelize.DATE, allowNull: true },
      { name: 'approved_by', type: Sequelize.BIGINT, allowNull: true },
      { name: 'approved_at', type: Sequelize.DATE, allowNull: true },
      { name: 'approval_notes', type: Sequelize.TEXT, allowNull: true },
      { name: 'rejected_by', type: Sequelize.BIGINT, allowNull: true },
      { name: 'rejected_at', type: Sequelize.DATE, allowNull: true },
      { name: 'rejection_reason', type: Sequelize.TEXT, allowNull: true },
      { name: 'assigned_to_company_id', type: Sequelize.BIGINT, allowNull: true },
      { name: 'assigned_by', type: Sequelize.BIGINT, allowNull: true },
      { name: 'assigned_at', type: Sequelize.DATE, allowNull: true },
      { name: 'assignment_notes', type: Sequelize.TEXT, allowNull: true },
      { name: 'started_at', type: Sequelize.DATE, allowNull: true },
      { name: 'completed_at', type: Sequelize.DATE, allowNull: true },
      { name: 'confirmed_at', type: Sequelize.DATE, allowNull: true },
      { name: 'confirmed_by', type: Sequelize.BIGINT, allowNull: true },
      { name: 'closed_at', type: Sequelize.DATE, allowNull: true },
      { name: 'progress_notes', type: Sequelize.TEXT, allowNull: true },
      { name: 'estimated_completion_date', type: Sequelize.DATE, allowNull: true }
    ];

    // 각 컬럼을 순차적으로 추가
    for (const col of columnsToAdd) {
      const exists = await columnExists('repair_requests', col.name);
      if (!exists) {
        try {
          await queryInterface.addColumn('repair_requests', col.name, {
            type: col.type,
            allowNull: col.allowNull,
            defaultValue: col.defaultValue
          });
          console.log(`Added column: ${col.name}`);
        } catch (e) {
          console.log(`Failed to add column ${col.name}:`, e.message);
        }
      } else {
        console.log(`Column ${col.name} already exists`);
      }
    }

    // title 컬럼을 nullable로 변경
    try {
      await queryInterface.changeColumn('repair_requests', 'title', {
        type: Sequelize.STRING(200),
        allowNull: true
      });
      console.log('Changed title column to nullable');
    } catch (e) {
      console.log('Failed to change title column:', e.message);
    }

    // request_type 컬럼을 nullable로 변경
    try {
      await queryInterface.changeColumn('repair_requests', 'request_type', {
        type: Sequelize.STRING,
        allowNull: true
      });
      console.log('Changed request_type column to nullable');
    } catch (e) {
      console.log('Failed to change request_type column:', e.message);
    }
  },

  down: async (queryInterface, Sequelize) => {
    // 롤백 시 추가한 컬럼 제거
    const columnsToRemove = [
      'request_number', 'mold_spec_id', 'severity', 'urgency', 'issue_type',
      'issue_description', 'ng_type', 'requester_id', 'requester_company_id',
      'requested_at', 'estimated_cost', 'actual_cost', 'blame_party',
      'blame_percentage', 'blame_reason', 'blame_confirmed', 'blame_confirmed_by',
      'blame_confirmed_at', 'approved_by', 'approved_at', 'approval_notes',
      'rejected_by', 'rejected_at', 'rejection_reason', 'assigned_to_company_id',
      'assigned_by', 'assigned_at', 'assignment_notes', 'started_at',
      'completed_at', 'confirmed_at', 'confirmed_by', 'closed_at',
      'progress_notes', 'estimated_completion_date'
    ];

    for (const col of columnsToRemove) {
      try {
        await queryInterface.removeColumn('repair_requests', col);
        console.log(`Removed column: ${col}`);
      } catch (e) {
        console.log(`Failed to remove column ${col}:`, e.message);
      }
    }
  }
};
