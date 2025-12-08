'use strict';

/**
 * 금형 이미지 및 제품 이미지 테이블 추가
 * 금형정보, 체크리스트, 점검, 수리 등 다양한 항목과 연계
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
      // 연계 항목 ID들
      checklist_id: {
        type: Sequelize.INTEGER,
        comment: '체크리스트 ID (daily_checks, inspections 등)'
      },
      checklist_item_id: {
        type: Sequelize.INTEGER,
        comment: '체크리스트 항목 ID'
      },
      repair_id: {
        type: Sequelize.INTEGER,
        comment: '수리 요청 ID'
      },
      transfer_id: {
        type: Sequelize.INTEGER,
        comment: '이관 ID'
      },
      maker_spec_id: {
        type: Sequelize.INTEGER,
        comment: '제작처 사양 ID'
      },
      // 연계 타입 (어떤 기능에서 사용되는지)
      reference_type: {
        type: Sequelize.STRING(50),
        comment: 'mold_info (금형정보), daily_check (일상점검), periodic_check (정기점검), repair (수리), transfer (이관), maker_checklist (제작처 체크리스트), development (금형개발)'
      },
      reference_id: {
        type: Sequelize.INTEGER,
        comment: '연계 항목의 ID (범용)'
      },
      image_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'mold (금형), product (제품), drawing (도면), defect (불량), repair_before (수리전), repair_after (수리후), inspection (점검), checklist (체크리스트), other (기타)'
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
    await queryInterface.addIndex('mold_images', ['reference_type']);
    await queryInterface.addIndex('mold_images', ['reference_id']);
    await queryInterface.addIndex('mold_images', ['checklist_id']);
    await queryInterface.addIndex('mold_images', ['repair_id']);
    await queryInterface.addIndex('mold_images', ['transfer_id']);

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
