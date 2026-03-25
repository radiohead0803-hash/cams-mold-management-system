const express = require('express');
const router = express.Router();
const { getCodeOptions, createCodeOption, updateCodeOption, deleteCodeOption } = require('../controllers/codeOptionsController');
const { authenticate } = require('../middleware/auth');

// GET /api/v1/code-options?category=repair_status,repair_problem_type
router.get('/', getCodeOptions);

// POST /api/v1/code-options (관리자 전용)
router.post('/', authenticate, createCodeOption);

// PATCH /api/v1/code-options/:id (관리자 전용)
router.patch('/:id', authenticate, updateCodeOption);

// DELETE /api/v1/code-options/:id (관리자 전용)
router.delete('/:id', authenticate, deleteCodeOption);

module.exports = router;
