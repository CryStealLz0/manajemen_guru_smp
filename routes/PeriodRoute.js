import express from 'express';
import {
  getPeriods,
  getPeriodById,
  createPeriod,
  updatePeriod,
  deletePeriod,
} from '../controllers/Period.js';

import {
  requireAuth,
  requireRole,
  ensureActiveUser,
} from '../middleware/Middleware.js';

const router = express.Router();

// Proteksi dasar semua endpoint
router.use(requireAuth, ensureActiveUser);

// Hanya admin yang boleh kelola data jam pelajaran
router.get('/', getPeriods);
router.get('/:id', getPeriodById);
router.post('/', requireRole('admin'), createPeriod);
router.put('/:id', requireRole('admin'), updatePeriod);
router.delete('/:id', requireRole('admin'), deletePeriod);

export default router;
