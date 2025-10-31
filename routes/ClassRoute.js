import express from 'express';
import {
  getClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} from '../controllers/Class.js';

import {
  requireAuth,
  requireRole,
  ensureActiveUser,
} from '../middleware/Middleware.js';

const router = express.Router();

// Proteksi dasar semua route
router.use(requireAuth, ensureActiveUser);

// Hanya admin yang boleh kelola data kelas
router.get('/', requireRole('admin'), getClasses);
router.get('/:id', requireRole('admin'), getClassById);
router.post('/', requireRole('admin'), createClass);
router.put('/:id', requireRole('admin'), updateClass);
router.delete('/:id', requireRole('admin'), deleteClass);

export default router;
