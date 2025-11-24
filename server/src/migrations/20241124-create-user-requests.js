'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('user_requests', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      company_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'companies',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '업체 ID'
      },
      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '요청자 ID (금형개발 담당자)'
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: '요청할 사용자 ID'
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        comment: '사용자 이름'
      },
      email: {
        type: Sequelize.STRING(100),
        comment: '이메일'
      },
      phone: {
        type: Sequelize.STRING(20),
        comment: '전화번호'
      },
      user_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'maker 또는 plant'
      },
      department: {
        type: Sequelize.STRING(100),
        comment: '부서'
      },
      position: {
        type: Sequelize.STRING(50),
        comment: '직급'
      },
      request_reason: {
        type: Sequelize.TEXT,
        comment: '요청 사유'
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'pending',
        comment: 'pending: 대기, approved: 승인, rejected: 거부'
      },
      approved_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '승인자 ID (시스템 관리자)'
      },
      approved_at: {
        type: Sequelize.DATE,
        comment: '승인 일시'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        comment: '거부 사유'
      },
      created_user_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '생성된 사용자 ID'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 인덱스 생성
    await queryInterface.addIndex('user_requests', ['company_id']);
    await queryInterface.addIndex('user_requests', ['requested_by']);
    await queryInterface.addIndex('user_requests', ['status']);
    await queryInterface.addIndex('user_requests', ['created_at']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_requests');
  }
};
