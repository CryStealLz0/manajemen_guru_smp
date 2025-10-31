import express from 'express';
import {
  getTimetables,
  getTimetableById,
  createTimetable,
  updateTimetable,
  deleteTimetable,
  getClassDailySchedule,
  getTeacherDailySchedule,
} from '../controllers/Timetable.js';

import {
  requireAuth,
  requireRole,
  ensureActiveUser,
} from '../middleware/Middleware.js';

const router = express.Router();

// Proteksi dasar semua endpoint
router.use(requireAuth, ensureActiveUser);

// CRUD Timetable — khusus admin
router.get('/', requireRole('admin'), getTimetables);
router.get('/:id', requireRole('admin'), getTimetableById);
router.post('/', requireRole('admin'), createTimetable);
router.put('/:id', requireRole('admin'), updateTimetable);
router.delete('/:id', requireRole('admin'), deleteTimetable);

// Convenience: jadwal harian kelas & guru
// Buka read-only utk admin & teacher (ubah jika ingin admin-only)
router.get(
  '/classes/:class_id/daily',
  requireRole('admin', 'teacher'),
  getClassDailySchedule,
);
// contoh: /api/timetables/classes/1/daily?semester_id=2&day_of_week=1

router.get(
  '/teachers/:teacher_id/daily',
  requireRole('admin', 'teacher'),
  getTeacherDailySchedule,
);
// contoh: /api/timetables/teachers/5/daily?semester_id=2&day_of_week=1

export default router;
