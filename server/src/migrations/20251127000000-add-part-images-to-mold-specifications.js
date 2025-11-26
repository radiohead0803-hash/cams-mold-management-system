'use strict';

/**
 * 마이그레이션: mold_specifications 테이블에 부품사진 필드 추가
 * - part_images: 부품 사진 URL 배열 (JSONB)
 */

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('mold_specifications', 'part_images', {
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: '부품 사진 URL 배열 - [{"url": "...", "filename": "...", "uploaded_at": "..."}]'
    });

    console.log('✅ part_images 필드가 mold_specifications 테이블에 추가되었습니다.');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('mold_specifications', 'part_images');
    console.log('✅ part_images 필드가 mold_specifications 테이블에서 제거되었습니다.');
  }
};
