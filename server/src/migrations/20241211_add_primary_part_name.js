'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // mold_specifications 테이블에 대표품번/대표품명 컬럼 추가
    await queryInterface.addColumn('mold_specifications', 'primary_part_number', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: '대표품번'
    });
    await queryInterface.addColumn('mold_specifications', 'primary_part_name', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: '대표품명'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('mold_specifications', 'primary_part_number');
    await queryInterface.removeColumn('mold_specifications', 'primary_part_name');
  }
};
