// routes/UserRoute.js
import express from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
} from '../controllers/Users.js';
import { requireAuth, requireRole } from '../middleware/Auth.js';

const router = express.Router();

// Semua route user hanya boleh diakses admin
router.get('/', requireAuth, requireRole('admin'), getUsers);
router.get('/:id', requireAuth, requireRole('admin'), getUserById);
router.post('/', requireAuth, requireRole('admin'), createUser);
router.put('/:id', requireAuth, requireRole('admin'), updateUser);
router.delete('/:id', requireAuth, requireRole('admin'), deleteUser);

export default router;
