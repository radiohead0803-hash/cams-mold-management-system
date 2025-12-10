const express = require('express');
const router = express.Router();
const transferController = require('../controllers/transferController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/transfers
router.get('/', authenticate, transferController.getTransfers);

// GET /api/v1/transfers/:id
router.get('/:id', authenticate, transferController.getTransferById);

// POST /api/v1/transfers
router.post('/', authenticate, transferController.createTransfer);

// PATCH /api/v1/transfers/:id/approve
router.patch('/:id/approve', authenticate, transferController.approveTransfer);

// PATCH /api/v1/transfers/:id/reject
router.patch('/:id/reject', authenticate, transferController.rejectTransfer);

// GET /api/v1/transfers/checklist/items - 체크리스트 항목 조회
router.get('/checklist/items', authenticate, transferController.getChecklistItems);

// 4M 체크리스트 템플릿 조회
router.get('/4m/template', authenticate, transferController.get4MChecklistTemplate);

// 4M 체크리스트 조회
router.get('/:transfer_id/4m', authenticate, transferController.get4MChecklist);

// 4M 체크리스트 저장
router.post('/:transfer_id/4m', authenticate, transferController.save4MChecklist);

// 반출 체크리스트 저장
router.post('/:transfer_id/shipment', authenticate, transferController.saveShipmentChecklist);

// 입고 체크리스트 저장
router.post('/:transfer_id/receiving', authenticate, transferController.saveReceivingChecklist);

module.exports = router;
