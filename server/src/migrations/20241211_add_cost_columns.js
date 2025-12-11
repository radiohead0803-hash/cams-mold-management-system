'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // icms_cost 컬럼 추가
    await queryInterface.addColumn('mold_specifications', 'icms_cost', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      comment: 'ICMS 비용 (원)'
    });

    // vendor_quote_cost 컬럼 추가
    await queryInterface.addColumn('mold_specifications', 'vendor_quote_cost', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      comment: '업체 견적가 (원)'
    });

    // 기존 estimated_cost 데이터를 icms_cost로 복사 (선택적)
    await queryInterface.sequelize.query(`
      UPDATE mold_specifications 
      SET icms_cost = estimated_cost 
      WHERE estimated_cost IS NOT NULL
    `);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('mold_specifications', 'icms_cost');
    await queryInterface.removeColumn('mold_specifications', 'vendor_quote_cost');
  }
};
