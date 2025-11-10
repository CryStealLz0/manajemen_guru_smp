import express from 'express';
import {
  getTeacherSubjects,
  getSubjectsByTeacher,
  getTeachersBySubject,
  addTeacherSubject,
  deleteTeacherSubject,
  setTeacherSubjects,
} from '../controllers/TeacherSubject.js';

import {
  requireAuth,
  requireRole,
  ensureActiveUser,
} from '../middleware/Middleware.js';

const router = express.Router();

// Proteksi dasar semua endpoint
router.use(requireAuth, ensureActiveUser);

/**
 * Daftar mapping (opsional filter: ?teacher_id=&subject_id=)
 * Contoh: GET /api/teacher-subjects?teacher_id=3
 */
router.get('/', requireRole('admin'), getTeacherSubjects);

/**
 * Ambil semua mapel milik seorang guru
 * Contoh: GET /api/teacher-subjects/teachers/3/subjects
 */
router.get(
  '/teachers/:teacher_id/subjects',

  getSubjectsByTeacher,
);

/**
 * Ambil semua guru pengampu untuk satu mapel
 * Contoh: GET /api/teacher-subjects/subjects/5/teachers
 */
router.get(
  '/subjects/:subject_id/teachers',

  getTeachersBySubject,
);

/**
 * Tambah satu relasi guru ↔ mapel
 * Body: { teacher_id, subject_id }
 */
router.post('/', requireRole('admin'), addTeacherSubject);

/**
 * Hapus satu relasi guru ↔ mapel
 * Body: { teacher_id, subject_id }
 */
router.delete('/', requireRole('admin'), deleteTeacherSubject);

/**
 * Replace seluruh mapel milik seorang guru (idempotent)
 * Body: { subject_ids: number[] }
 * Contoh: PUT /api/teacher-subjects/teachers/3/subjects
 */
router.put(
  '/teachers/:teacher_id/subjects',
  requireRole('admin'),
  setTeacherSubjects,
);

export default router;
