const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const userManagementController = require('../controllers/userManagementController');

// 모든 라우트에 인증 필요
router.use(authenticate);

// ==================== 사내 사용자 관리 ====================
router.get('/internal', authorize(['system_admin', 'mold_developer']), userManagementController.getInternalUsers);
router.post('/internal', authorize(['system_admin']), userManagementController.createInternalUser);
router.put('/internal/:id', authorize(['system_admin']), userManagementController.updateInternalUser);
router.post('/internal/:id/reset-password', authorize(['system_admin']), userManagementController.resetPassword);

// ==================== 협력사 사용자 관리 ====================
router.get('/partner', authorize(['system_admin', 'mold_developer']), userManagementController.getPartnerUsers);
router.post('/partner', authorize(['system_admin', 'mold_developer']), userManagementController.createPartnerUser);
router.put('/partner/:id', authorize(['system_admin', 'mold_developer']), userManagementController.updatePartnerUser);
router.post('/partner/:id/reset-password', authorize(['system_admin']), userManagementController.resetPassword);

// ==================== 승인 관리 ====================
router.get('/approvals/pending', authorize(['system_admin']), userManagementController.getPendingApprovals);
router.post('/approvals/:id/approve', authorize(['system_admin']), userManagementController.approveUser);
router.post('/approvals/:id/reject', authorize(['system_admin']), userManagementController.rejectUser);

// ==================== 공통 ====================
router.get('/permission-classes', userManagementController.getPermissionClasses);
router.get('/departments', userManagementController.getDepartments);
router.delete('/:id', authorize(['system_admin']), userManagementController.deleteUser);

module.exports = router;
