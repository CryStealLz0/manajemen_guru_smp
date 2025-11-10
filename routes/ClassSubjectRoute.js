import express from 'express';
import {
  getClassSubjects,
  getSubjectsByClass,
  getClassesBySubject,
  addClassSubject,
  deleteClassSubject,
  setClassSubjects,
} from '../controllers/ClassSubject.js';

import {
  requireAuth,
  requireRole,
  ensureActiveUser,
} from '../middleware/Middleware.js';

const router = express.Router();

// Proteksi dasar semua endpoint
router.use(requireAuth, ensureActiveUser);

/**
 * Mapping pivot (opsional filter: ?class_id=&subject_id=)
 * Contoh: GET /api/class-subjects?class_id=1
 */
router.get('/', getClassSubjects);

/**
 * Ambil semua subject milik suatu kelas
 * Contoh: GET /api/class-subjects/classes/1/subjects
 */
router.get(
  '/classes/:class_id/subjects',

  getSubjectsByClass,
);

/**
 * Ambil semua kelas yang punya subject tertentu
 * Contoh: GET /api/class-subjects/subjects/2/classes
 */
router.get(
  '/subjects/:subject_id/classes',

  getClassesBySubject,
);

/**
 * Tambah satu relasi kelas ↔ subject
 * Body: { class_id, subject_id }
 */
router.post('/', requireRole('admin'), addClassSubject);

/**
 * Hapus satu relasi kelas ↔ subject
 * Body: { class_id, subject_id }
 */
router.delete('/', requireRole('admin'), deleteClassSubject);

/**
 * Replace seluruh subjects milik suatu kelas (idempotent)
 * Body: { subject_ids: number[] }
 * Contoh: PUT /api/class-subjects/classes/1/subjects
 */
router.put(
  '/classes/:class_id/subjects',
  requireRole('admin'),
  setClassSubjects,
);

export default router;
