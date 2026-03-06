const router = require('express').Router();
const { authenticate } = require('../middleware/auth');
const { Draft } = require('../models');
const { Op } = require('sequelize');

/**
 * 임시저장 저장/업데이트 (UPSERT)
 * PUT /api/v1/drafts/:draftKey/:draftId
 */
router.put('/:draftKey/:draftId', authenticate, async (req, res) => {
  try {
    const { draftKey, draftId } = req.params;
    const { data } = req.body;
    const userId = req.user.id;

    if (!data) {
      return res.status(400).json({ success: false, message: 'data 필드가 필요합니다.' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [draft, created] = await Draft.findOrCreate({
      where: { user_id: userId, draft_key: draftKey, draft_id: draftId },
      defaults: { data, expires_at: expiresAt }
    });

    if (!created) {
      await draft.update({ data, expires_at: expiresAt });
    }

    return res.json({
      success: true,
      message: created ? '임시저장 생성' : '임시저장 업데이트',
      data: { id: draft.id, saved_at: draft.updated_at }
    });
  } catch (error) {
    console.error('[Draft] Save error:', error);
    return res.status(500).json({ success: false, message: '임시저장 실패' });
  }
});

/**
 * 임시저장 조회
 * GET /api/v1/drafts/:draftKey/:draftId
 */
router.get('/:draftKey/:draftId', authenticate, async (req, res) => {
  try {
    const { draftKey, draftId } = req.params;
    const userId = req.user.id;

    const draft = await Draft.findOne({
      where: {
        user_id: userId,
        draft_key: draftKey,
        draft_id: draftId,
        expires_at: { [Op.gt]: new Date() }
      }
    });

    if (!draft) {
      return res.json({ success: true, data: null });
    }

    return res.json({
      success: true,
      data: {
        id: draft.id,
        data: draft.data,
        saved_at: draft.updated_at
      }
    });
  } catch (error) {
    console.error('[Draft] Load error:', error);
    return res.status(500).json({ success: false, message: '임시저장 조회 실패' });
  }
});

/**
 * 임시저장 삭제
 * DELETE /api/v1/drafts/:draftKey/:draftId
 */
router.delete('/:draftKey/:draftId', authenticate, async (req, res) => {
  try {
    const { draftKey, draftId } = req.params;
    const userId = req.user.id;

    await Draft.destroy({
      where: { user_id: userId, draft_key: draftKey, draft_id: draftId }
    });

    return res.json({ success: true, message: '임시저장 삭제 완료' });
  } catch (error) {
    console.error('[Draft] Delete error:', error);
    return res.status(500).json({ success: false, message: '임시저장 삭제 실패' });
  }
});

/**
 * 사용자의 전체 임시저장 목록
 * GET /api/v1/drafts
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;

    const drafts = await Draft.findAll({
      where: {
        user_id: userId,
        expires_at: { [Op.gt]: new Date() }
      },
      order: [['updated_at', 'DESC']]
    });

    return res.json({
      success: true,
      data: drafts.map(d => ({
        id: d.id,
        draft_key: d.draft_key,
        draft_id: d.draft_id,
        saved_at: d.updated_at
      }))
    });
  } catch (error) {
    console.error('[Draft] List error:', error);
    return res.status(500).json({ success: false, message: '목록 조회 실패' });
  }
});

module.exports = router;
