'use strict';

/**
 * inspection_photos 테이블 생성 마이그레이션
 * 점검 사진 저장용 테이블
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('inspection_photos', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.literal('gen_random_uuid()')
      },
      mold_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'molds',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      checklist_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '체크리스트 ID'
      },
      item_status_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '점검 항목 상태 ID'
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: '파일 URL'
      },
      thumbnail_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: '썸네일 URL'
      },
      file_type: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: '파일 타입 (image/jpeg, image/png 등)'
      },
      file_size: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '파일 크기 (bytes)'
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
        comment: '업로드한 사용자 ID'
      },
      shot_count: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: '업로드 시점 숏수'
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
        comment: '추가 메타데이터 (item_id, inspection_type 등)'
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('NOW()'),
        comment: '업로드 일시'
      }
    });

    // 인덱스 생성
    await queryInterface.addIndex('inspection_photos', ['mold_id'], {
      name: 'idx_inspection_photos_mold_id'
    });
    await queryInterface.addIndex('inspection_photos', ['checklist_id'], {
      name: 'idx_inspection_photos_checklist_id'
    });
    await queryInterface.addIndex('inspection_photos', ['item_status_id'], {
      name: 'idx_inspection_photos_item_status_id'
    });
    await queryInterface.addIndex('inspection_photos', ['uploaded_at'], {
      name: 'idx_inspection_photos_uploaded_at'
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('inspection_photos');
  }
};
