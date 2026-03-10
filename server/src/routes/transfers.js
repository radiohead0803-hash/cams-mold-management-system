const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/v1/transfers/checklist/items - 체크리스트 항목 조회 (파라미터 라우트보다 먼저)
router.get('/checklist/items', authenticate, transferController.getChecklistItems);

// 4M 체크리스트 템플릿 조회
router.get('/4m/template', authenticate, transferController.get4MChecklistTemplate);

// GET /api/v1/transfers
router.get('/', authenticate, transferController.getTransfers);

// GET /api/v1/transfers/:id
router.get('/:id', authenticate, transferController.getTransferById);

// POST /api/v1/transfers (생성 + 단계별 임시저장)
router.post('/', authenticate, authorize(['plant', 'mold_developer', 'system_admin']), transferController.createTransfer);

// PATCH /api/v1/transfers/:id (업데이트/단계별 임시저장)
router.patch('/:id', authenticate, authorize(['plant', 'mold_developer', 'system_admin']), transferController.updateTransfer);

// PATCH /api/v1/transfers/:id/approve (승인 - plant 포함)
router.patch('/:id/approve', authenticate, authorize(['plant', 'mold_developer', 'system_admin']), transferController.approveTransfer);

// PATCH /api/v1/transfers/:id/reject (반려 - plant 포함)
router.patch('/:id/reject', authenticate, authorize(['plant', 'mold_developer', 'system_admin']), transferController.rejectTransfer);

// 4M 체크리스트 조회
router.get('/:transfer_id/4m', authenticate, transferController.get4MChecklist);

// 4M 체크리스트 저장
router.post('/:transfer_id/4m', authenticate, transferController.save4MChecklist);

// 반출 체크리스트 저장
router.post('/:transfer_id/shipment', authenticate, transferController.saveShipmentChecklist);

// 입고 체크리스트 저장
router.post('/:transfer_id/receiving', authenticate, transferController.saveReceivingChecklist);

module.exports = router;
