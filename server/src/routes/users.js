const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/v1/users
router.get('/', authenticate, authorize(['system_admin', 'hq_manager']), userController.getUsers);

// GET /api/v1/users/:id
router.get('/:id', authenticate, userController.getUserById);

// POST /api/v1/users
router.post('/', authenticate, authorize(['system_admin']), userController.createUser);

// PATCH /api/v1/users/:id
router.patch('/:id', authenticate, userController.updateUser);

// DELETE /api/v1/users/:id
router.delete('/:id', authenticate, authorize(['system_admin']), userController.deleteUser);

module.exports = router;
