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

    // maker_specifications 테이블에 연동 컬럼 추가 (본사 연동용)
    await queryInterface.addColumn('maker_specifications', 'primary_part_number', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: '대표품번 (본사 연동)'
    });
    await queryInterface.addColumn('maker_specifications', 'primary_part_name', {
      type: Sequelize.STRING(200),
      allowNull: true,
      comment: '대표품명 (본사 연동)'
    });
    await queryInterface.addColumn('maker_specifications', 'mold_spec_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: '제작사양 (본사 연동)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('mold_specifications', 'primary_part_number');
    await queryInterface.removeColumn('mold_specifications', 'primary_part_name');
    await queryInterface.removeColumn('maker_specifications', 'primary_part_number');
    await queryInterface.removeColumn('maker_specifications', 'primary_part_name');
    await queryInterface.removeColumn('maker_specifications', 'mold_spec_type');
  }
};
