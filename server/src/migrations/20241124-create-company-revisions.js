'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('company_revisions', {
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
      revision_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '리비전 번호 (1, 2, 3, ...)'
      },
      changed_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '변경자 ID'
      },
      change_reason: {
        type: Sequelize.TEXT,
        comment: '변경 사유'
      },
      changed_fields: {
        type: Sequelize.JSONB,
        comment: '변경된 필드 목록 (배열)'
      },
      old_values: {
        type: Sequelize.JSONB,
        comment: '변경 전 값 (JSON)'
      },
      new_values: {
        type: Sequelize.JSONB,
        comment: '변경 후 값 (JSON)'
      },
      ip_address: {
        type: Sequelize.STRING(45),
        comment: '변경 시 IP 주소'
      },
      user_agent: {
        type: Sequelize.TEXT,
        comment: '변경 시 User Agent'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 인덱스 생성
    await queryInterface.addIndex('company_revisions', ['company_id']);
    await queryInterface.addIndex('company_revisions', ['changed_by']);
    await queryInterface.addIndex('company_revisions', ['created_at']);
    await queryInterface.addIndex('company_revisions', ['company_id', 'revision_number'], {
      unique: true,
      name: 'company_revisions_company_revision_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('company_revisions');
  }
};
