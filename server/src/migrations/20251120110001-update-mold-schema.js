'use strict';

/**
 * Mold 테이블 스키마 업데이트
 * - current_shots 추가 (타수 자동 누적)
 * - specification_id 추가 (MoldSpecification 연결)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. current_shots 컬럼 추가
    await queryInterface.addColumn('molds', 'current_shots', {
      type: Sequelize.INTEGER,
      defaultValue: 0,
      allowNull: false,
      comment: '현재 타수 (자동 누적)'
    });

    // 2. specification_id 컬럼 추가
    await queryInterface.addColumn('molds', 'specification_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'mold_specifications',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: '금형제작사양 ID'
    });

    // 3. 인덱스 추가
    await queryInterface.addIndex('molds', ['specification_id'], {
      name: 'idx_molds_specification_id'
    });
  },

  async down(queryInterface, Sequelize) {
    // 롤백: 새 컬럼 제거
    await queryInterface.removeColumn('molds', 'current_shots');
    await queryInterface.removeColumn('molds', 'specification_id');
  }
};
