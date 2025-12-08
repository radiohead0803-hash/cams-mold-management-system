'use strict';

/**
 * 금형 이미지 및 제품 이미지 테이블 추가
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. mold_images 테이블 생성
    await queryInterface.createTable('mold_images', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      mold_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'molds',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      mold_spec_id: {
        type: Sequelize.INTEGER,
        references: {
          model: 'mold_specifications',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      image_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'mold (금형 이미지), product (제품 이미지), drawing (도면), other (기타)'
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
        comment: '썸네일 URL'
      },
      original_filename: {
        type: Sequelize.STRING(255),
        comment: '원본 파일명'
      },
      file_size: {
        type: Sequelize.INTEGER,
        comment: '파일 크기 (bytes)'
      },
      mime_type: {
        type: Sequelize.STRING(100),
        comment: 'MIME 타입'
      },
      width: {
        type: Sequelize.INTEGER,
        comment: '이미지 너비'
      },
      height: {
        type: Sequelize.INTEGER,
        comment: '이미지 높이'
      },
      description: {
        type: Sequelize.TEXT,
        comment: '이미지 설명'
      },
      is_primary: {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        comment: '대표 이미지 여부'
      },
      display_order: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: '표시 순서'
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        references: {
          model: 'users',
          key: 'id'
        }
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()')
      }
    });

    await queryInterface.addIndex('mold_images', ['mold_id']);
    await queryInterface.addIndex('mold_images', ['mold_spec_id']);
    await queryInterface.addIndex('mold_images', ['image_type']);
    await queryInterface.addIndex('mold_images', ['is_primary']);

    // 2. mold_specifications 테이블에 이미지 URL 컬럼 추가
    await queryInterface.addColumn('mold_specifications', 'mold_image_url', {
      type: Sequelize.STRING(500),
      comment: '금형 대표 이미지 URL'
    });

    await queryInterface.addColumn('mold_specifications', 'product_image_url', {
      type: Sequelize.STRING(500),
      comment: '제품 대표 이미지 URL'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('mold_specifications', 'mold_image_url');
    await queryInterface.removeColumn('mold_specifications', 'product_image_url');
    await queryInterface.dropTable('mold_images');
  }
};
