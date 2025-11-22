'use strict';

/**
 * User 테이블 스키마 업데이트
 * - role_group, role_detail, plant_id, maker_id 제거
 * - user_type, company_id, company_name, company_type 추가
 * - 보안 필드 추가 (failed_login_attempts, locked_until, last_login_ip)
 * - last_login → last_login_at 변경
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. 새 컬럼 추가
    await queryInterface.addColumn('users', 'user_type', {
      type: Sequelize.STRING(20),
      allowNull: true, // 임시로 null 허용
      comment: 'system_admin, mold_developer, maker, plant'
    });

    await queryInterface.addColumn('users', 'company_id', {
      type: Sequelize.INTEGER,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'company_name', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'company_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'hq, maker, plant'
    });

    await queryInterface.addColumn('users', 'failed_login_attempts', {
      type: Sequelize.INTEGER,
      defaultValue: 0
    });

    await queryInterface.addColumn('users', 'locked_until', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'last_login_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('users', 'last_login_ip', {
      type: Sequelize.STRING(45),
      allowNull: true
    });

    // 2. 기존 데이터 마이그레이션
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET user_type = CASE 
        WHEN role_detail = 'system_admin' THEN 'system_admin'
        WHEN role_detail = 'development_manager' THEN 'mold_developer'
        WHEN role_group = 'maker' THEN 'maker'
        WHEN role_group = 'plant' THEN 'plant'
        ELSE 'plant'
      END,
      company_type = role_group,
      company_id = COALESCE(plant_id, maker_id, 1),
      last_login_at = last_login
    `);

    // 3. user_type NOT NULL 제약조건 추가
    await queryInterface.changeColumn('users', 'user_type', {
      type: Sequelize.STRING(20),
      allowNull: false,
      comment: 'system_admin, mold_developer, maker, plant'
    });

    // 4. 인덱스 추가
    await queryInterface.addIndex('users', ['user_type'], {
      name: 'idx_users_user_type'
    });

    await queryInterface.addIndex('users', ['company_id'], {
      name: 'idx_users_company_id'
    });

    await queryInterface.addIndex('users', ['company_type'], {
      name: 'idx_users_company_type'
    });

    // 5. 구 컬럼 제거 (선택적 - 데이터 백업 후 실행)
    // await queryInterface.removeColumn('users', 'role_group');
    // await queryInterface.removeColumn('users', 'role_detail');
    // await queryInterface.removeColumn('users', 'plant_id');
    // await queryInterface.removeColumn('users', 'maker_id');
    // await queryInterface.removeColumn('users', 'last_login');
  },

  async down(queryInterface, Sequelize) {
    // 롤백: 새 컬럼 제거
    await queryInterface.removeColumn('users', 'user_type');
    await queryInterface.removeColumn('users', 'company_id');
    await queryInterface.removeColumn('users', 'company_name');
    await queryInterface.removeColumn('users', 'company_type');
    await queryInterface.removeColumn('users', 'failed_login_attempts');
    await queryInterface.removeColumn('users', 'locked_until');
    await queryInterface.removeColumn('users', 'last_login_at');
    await queryInterface.removeColumn('users', 'last_login_ip');
  }
};
