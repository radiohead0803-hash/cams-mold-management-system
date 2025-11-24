'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 기존 외래키 제약조건 제거 (있는 경우)
    try {
      await queryInterface.removeConstraint(
        'mold_specifications',
        'mold_specifications_target_maker_id_fkey'
      );
      console.log('✅ Removed old foreign key constraint on target_maker_id');
    } catch (error) {
      console.log('ℹ️ No existing foreign key constraint found (this is okay)');
    }

    // target_maker_id를 companies 테이블을 참조하도록 변경
    await queryInterface.changeColumn('mold_specifications', 'target_maker_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'companies',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: '제작처 회사 ID (maker_company_id와 동일)'
    });

    console.log('✅ Updated target_maker_id to reference companies table');
  },

  async down(queryInterface, Sequelize) {
    // 롤백 시 users 테이블을 참조하도록 되돌림
    try {
      await queryInterface.removeConstraint(
        'mold_specifications',
        'mold_specifications_target_maker_id_fkey'
      );
    } catch (error) {
      console.log('ℹ️ No foreign key constraint to remove');
    }

    await queryInterface.changeColumn('mold_specifications', 'target_maker_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });

    console.log('⚠️ Rolled back target_maker_id to reference users table');
  }
};
