'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Idempotent migration: add column/index only if missing
    const table = await queryInterface.describeTable('mold_specifications');
    if (!table.mold_id) {
      await queryInterface.addColumn('mold_specifications', 'mold_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'molds',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
        comment: '연동된 금형 마스터 ID'
      });
      console.log('✅ mold_specifications.mold_id 컬럼 추가 완료');
    } else {
      console.log('ℹ️ mold_specifications.mold_id 컬럼 이미 존재 – 추가 생략');
    }

    const indexes = await queryInterface.showIndex('mold_specifications');
    const hasIdx = indexes?.some((idx) => idx.name === 'idx_mold_specifications_mold_id');
    if (!hasIdx) {
      await queryInterface.addIndex('mold_specifications', ['mold_id'], {
        name: 'idx_mold_specifications_mold_id'
      });
      console.log('✅ mold_specifications.mold_id 인덱스 생성 완료');
    } else {
      console.log('ℹ️ mold_specifications.mold_id 인덱스 이미 존재 – 생성 생략');
    }
  },

  async down(queryInterface, Sequelize) {
    // 인덱스 제거
    await queryInterface.removeIndex('mold_specifications', 'idx_mold_specifications_mold_id');
    
    // 컬럼 제거
    await queryInterface.removeColumn('mold_specifications', 'mold_id');

    console.log('✅ mold_specifications 테이블에서 mold_id 컬럼 제거 완료');
  }
};
