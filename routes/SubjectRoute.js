// routes/subjectRoutes.js
import express from 'express';
import {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
} from '../controllers/Subject.js';

import {
  requireAuth,
  requireRole,
  ensureActiveUser,
} from '../middleware/Middleware.js';

const router = express.Router();

// Proteksi dasar untuk semua rute
router.use(requireAuth, ensureActiveUser);

// Hanya admin yang boleh mengelola data mata pelajaran
router.get('/', getSubjects);
router.get('/:id', getSubjectById);
router.post('/', requireRole('admin'), createSubject);
router.put('/:id', requireRole('admin'), updateSubject);
router.delete('/:id', requireRole('admin'), deleteSubject);

export default router;
