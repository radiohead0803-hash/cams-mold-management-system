const express = require('express');
const router = express.Router();
const codeOptionsController = require('../controllers/codeOptionsController');
const authMiddleware = require('../middleware/auth');

const auth = authMiddleware.authenticate;

// GET /api/v1/code-options?category=repair_status,repair_problem_type
router.get('/', codeOptionsController.getCodeOptions);

// POST /api/v1/code-options (관리자 전용)
router.post('/', auth, codeOptionsController.createCodeOption);

// PATCH /api/v1/code-options/:id (관리자 전용)
router.patch('/:id', auth, codeOptionsController.updateCodeOption);

// DELETE /api/v1/code-options/:id (관리자 전용)
router.delete('/:id', auth, codeOptionsController.deleteCodeOption);

module.exports = router;
