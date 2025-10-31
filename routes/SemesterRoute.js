// routes/semesterRoutes.js
import express from 'express';
import {
  getSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester,
} from '../controllers/Semester.js';

import {
  requireAuth,
  requireRole,
  ensureActiveUser,
} from '../middleware/Middleware.js';

const router = express.Router();

// Proteksi dasar semua endpoint
router.use(requireAuth, ensureActiveUser);

// Hanya admin yang boleh kelola semesters
router.get('/', requireRole('admin'), getSemesters); // ?academic_year_id=...
router.get('/:id', requireRole('admin'), getSemesterById);
router.post('/', requireRole('admin'), createSemester);
router.put('/:id', requireRole('admin'), updateSemester);
router.delete('/:id', requireRole('admin'), deleteSemester);

export default router;
