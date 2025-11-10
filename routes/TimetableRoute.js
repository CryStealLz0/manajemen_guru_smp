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
router.get('/', getTimetables);
router.get('/:id', getTimetableById);
router.post('/', requireRole('admin'), createTimetable);
router.put('/:id', requireRole('admin'), updateTimetable);
router.delete('/:id', requireRole('admin'), deleteTimetable);

// === Convenience (letakkan duluan) ===
router.get(
  '/classes/:class_id/daily',

  getClassDailySchedule,
);
router.get(
  '/teachers/:teacher_id/daily',

  getTeacherDailySchedule,
);

export default router;
