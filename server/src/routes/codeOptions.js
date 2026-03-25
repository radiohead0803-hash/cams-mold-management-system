const express = require('express');
const router = express.Router();
const { getCodeOptions, createCodeOption, updateCodeOption, deleteCodeOption } = require('../controllers/codeOptionsController');
const authMiddleware = require('../middleware/auth');

// GET /api/v1/code-options?category=repair_status,repair_problem_type
router.get('/', getCodeOptions);

// POST /api/v1/code-options (관리자 전용)
router.post('/', authMiddleware, createCodeOption);

// PATCH /api/v1/code-options/:id (관리자 전용)
router.patch('/:id', authMiddleware, updateCodeOption);

// DELETE /api/v1/code-options/:id (관리자 전용)
router.delete('/:id', authMiddleware, deleteCodeOption);

module.exports = router;
