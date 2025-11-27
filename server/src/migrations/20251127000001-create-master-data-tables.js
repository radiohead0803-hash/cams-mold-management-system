'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. 차종 마스터 테이블
    await queryInterface.createTable('car_models', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      model_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '차종명 (예: K5, K8, Sportage)'
      },
      model_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '차종 코드'
      },
      manufacturer: {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: '제조사'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: '활성 상태'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '정렬 순서'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 2. 재질 마스터 테이블
    await queryInterface.createTable('materials', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      material_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '재질명 (예: NAK80, P20, S50C)'
      },
      material_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '재질 코드'
      },
      category: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '재질 분류 (예: 프리하든강, 합금강)'
      },
      hardness: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '경도 (예: HRC 38-42)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '설명'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: '활성 상태'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '정렬 순서'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 3. 금형타입 마스터 테이블
    await queryInterface.createTable('mold_types', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      type_name: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
        comment: '금형타입명 (예: 사출금형, 프레스금형)'
      },
      type_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '금형타입 코드'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '설명'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: '활성 상태'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '정렬 순서'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 4. 톤수 마스터 테이블
    await queryInterface.createTable('tonnages', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      tonnage_value: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        comment: '톤수 (예: 350, 500, 650)'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '설명'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        comment: '활성 상태'
      },
      sort_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '정렬 순서'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // 인덱스 생성
    await queryInterface.addIndex('car_models', ['model_name']);
    await queryInterface.addIndex('car_models', ['is_active']);
    await queryInterface.addIndex('materials', ['material_name']);
    await queryInterface.addIndex('materials', ['is_active']);
    await queryInterface.addIndex('mold_types', ['type_name']);
    await queryInterface.addIndex('mold_types', ['is_active']);
    await queryInterface.addIndex('tonnages', ['tonnage_value']);
    await queryInterface.addIndex('tonnages', ['is_active']);

    // 기본 데이터 삽입
    // 차종
    await queryInterface.bulkInsert('car_models', [
      { model_name: 'K5', model_code: 'DL3', manufacturer: '기아', sort_order: 1, created_at: new Date(), updated_at: new Date() },
      { model_name: 'K8', model_code: 'GL3', manufacturer: '기아', sort_order: 2, created_at: new Date(), updated_at: new Date() },
      { model_name: 'Sportage', model_code: 'NQ5', manufacturer: '기아', sort_order: 3, created_at: new Date(), updated_at: new Date() },
      { model_name: 'Sorento', model_code: 'MQ4', manufacturer: '기아', sort_order: 4, created_at: new Date(), updated_at: new Date() },
      { model_name: 'G5', model_code: 'G5', manufacturer: '현대', sort_order: 5, created_at: new Date(), updated_at: new Date() }
    ]);

    // 재질
    await queryInterface.bulkInsert('materials', [
      { material_name: 'NAK80', material_code: 'NAK80', category: '프리하든강', hardness: 'HRC 37-43', sort_order: 1, created_at: new Date(), updated_at: new Date() },
      { material_name: 'P20', material_code: 'P20', category: '합금강', hardness: 'HRC 28-32', sort_order: 2, created_at: new Date(), updated_at: new Date() },
      { material_name: 'S50C', material_code: 'S50C', category: '탄소강', hardness: 'HRC 20-25', sort_order: 3, created_at: new Date(), updated_at: new Date() },
      { material_name: 'HPM38', material_code: 'HPM38', category: '프리하든강', hardness: 'HRC 38-42', sort_order: 4, created_at: new Date(), updated_at: new Date() },
      { material_name: 'SKD61', material_code: 'SKD61', category: '열간공구강', hardness: 'HRC 48-52', sort_order: 5, created_at: new Date(), updated_at: new Date() }
    ]);

    // 금형타입
    await queryInterface.bulkInsert('mold_types', [
      { type_name: '사출금형', type_code: 'INJECTION', description: '플라스틱 사출 성형용 금형', sort_order: 1, created_at: new Date(), updated_at: new Date() },
      { type_name: '프레스금형', type_code: 'PRESS', description: '금속 프레스 성형용 금형', sort_order: 2, created_at: new Date(), updated_at: new Date() },
      { type_name: '다이캐스팅금형', type_code: 'DIECASTING', description: '다이캐스팅 성형용 금형', sort_order: 3, created_at: new Date(), updated_at: new Date() },
      { type_name: '블로우금형', type_code: 'BLOW', description: '블로우 성형용 금형', sort_order: 4, created_at: new Date(), updated_at: new Date() }
    ]);

    // 톤수
    await queryInterface.bulkInsert('tonnages', [
      { tonnage_value: 180, sort_order: 1, created_at: new Date(), updated_at: new Date() },
      { tonnage_value: 280, sort_order: 2, created_at: new Date(), updated_at: new Date() },
      { tonnage_value: 350, sort_order: 3, created_at: new Date(), updated_at: new Date() },
      { tonnage_value: 420, sort_order: 4, created_at: new Date(), updated_at: new Date() },
      { tonnage_value: 500, sort_order: 5, created_at: new Date(), updated_at: new Date() },
      { tonnage_value: 650, sort_order: 6, created_at: new Date(), updated_at: new Date() },
      { tonnage_value: 800, sort_order: 7, created_at: new Date(), updated_at: new Date() },
      { tonnage_value: 1000, sort_order: 8, created_at: new Date(), updated_at: new Date() }
    ]);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('tonnages');
    await queryInterface.dropTable('mold_types');
    await queryInterface.dropTable('materials');
    await queryInterface.dropTable('car_models');
  }
};
