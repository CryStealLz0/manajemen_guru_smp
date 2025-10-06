// routes/roleRoutes.js
import express from 'express';
import {
    getRoles,
    getRoleById,
    createRole,
    updateRole,
    deleteRole,
} from '../controllers/Roles.js';

import {
    requireAuth,
    requireRole,
    ensureActiveUser,
} from '../middleware/Middleware.js';

const router = express.Router();

// Semua rute proteksi dasar + pastikan akun aktif
router.use(requireAuth, ensureActiveUser);

// Semua route user hanya boleh diakses admin
router.get('/', requireAuth, requireRole('admin'), getRoles);
router.get('/:id', requireAuth, requireRole('admin'), getRoleById);
router.post('/', requireAuth, requireRole('admin'), createRole);
router.put('/:id', requireAuth, requireRole('admin'), updateRole);
router.delete('/:id', requireAuth, requireRole('admin'), deleteRole);

export default router;
