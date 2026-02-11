import { Router } from 'express';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';
import { requireAuth } from '../middleware/requireAuth';
import { 
  submitDailyInspection,
  saveDailyInspectionDraft,
  requestDailyInspectionApproval,
  approveDailyInspection,
  rejectDailyInspection,
  getDailyInspectionsByStatus,
  getDailyInspection
} from '../controllers/inspectionController';

const router = Router();

// Validation middleware
const dailyInspectionValidation = [
  body('session_id').notEmpty().withMessage('세션 ID는 필수입니다'),
  body('mold_id').isInt().withMessage('금형 ID는 필수입니다'),
  body('production_quantity').isInt({ min: 0 }).withMessage('생산수량은 0 이상이어야 합니다'),
  body('ng_quantity').isInt({ min: 0 }).withMessage('NG 수량은 0 이상이어야 합니다'),
];

// Routes
router.post(
  '/daily/draft',
  requireAuth(['maker', 'plant']),
  dailyInspectionValidation,
  validateRequest,
  saveDailyInspectionDraft
);

router.post(
  '/daily/request-approval',
  requireAuth(['maker', 'plant']),
  [
    ...dailyInspectionValidation,
    body('approver_id').isInt().withMessage('승인자 ID는 필수입니다')
  ],
  validateRequest,
  requestDailyInspectionApproval
);

router.post(
  '/daily',
  requireAuth(['maker', 'plant']),
  dailyInspectionValidation,
  validateRequest,
  submitDailyInspection
);

router.post(
  '/daily/:id/approve',
  requireAuth(['system_admin']),
  validateRequest,
  approveDailyInspection
);

router.post(
  '/daily/:id/reject',
  requireAuth(['system_admin']),
  [
    body('rejection_reason').notEmpty().withMessage('반려 사유는 필수입니다')
  ],
  validateRequest,
  rejectDailyInspection
);

router.get(
  '/daily/status/:status',
  requireAuth(['system_admin', 'maker', 'plant']),
  getDailyInspectionsByStatus
);

router.get(
  '/daily/:id',
  requireAuth(['system_admin', 'maker', 'plant']),
  getDailyInspection
);

export default router;
