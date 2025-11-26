'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // mold_specifications 테이블에 mold_id 컬럼 추가
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

    // 인덱스 추가
    await queryInterface.addIndex('mold_specifications', ['mold_id'], {
      name: 'idx_mold_specifications_mold_id'
    });

    console.log('✅ mold_specifications 테이블에 mold_id 컬럼 추가 완료');
  },

  async down(queryInterface, Sequelize) {
    // 인덱스 제거
    await queryInterface.removeIndex('mold_specifications', 'idx_mold_specifications_mold_id');
    
    // 컬럼 제거
    await queryInterface.removeColumn('mold_specifications', 'mold_id');

    console.log('✅ mold_specifications 테이블에서 mold_id 컬럼 제거 완료');
  }
};
