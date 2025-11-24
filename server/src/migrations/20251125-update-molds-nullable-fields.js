'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // plant_id와 maker_id를 nullable로 변경
    await queryInterface.changeColumn('molds', 'plant_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '생산처 ID (초기 등록 시 null 가능)'
    });

    await queryInterface.changeColumn('molds', 'maker_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: '제작처 ID (초기 등록 시 null 가능)'
    });

    console.log('✅ Molds table updated: plant_id and maker_id are now nullable');
  },

  async down(queryInterface, Sequelize) {
    // 롤백 시 NOT NULL로 되돌림 (데이터가 있는 경우 주의)
    await queryInterface.changeColumn('molds', 'plant_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    await queryInterface.changeColumn('molds', 'maker_id', {
      type: Sequelize.INTEGER,
      allowNull: false
    });

    console.log('⚠️ Molds table rolled back: plant_id and maker_id are now NOT NULL');
  }
};
