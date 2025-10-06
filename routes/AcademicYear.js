// routes/academicYearRoutes.js
import express from 'express';
import {
    getAcademicYears,
    getAcademicYearById,
    createAcademicYear,
    updateAcademicYear,
    deleteAcademicYear,
} from '../controllers/AcademicYear.js';

import { requireAuth, requireRole } from '../middleware/Middleware.js';

const router = express.Router();

router.get('/', requireAuth, getAcademicYears);
router.get('/:id', requireAuth, getAcademicYearById);
router.post('/', requireAuth, requireRole('admin'), createAcademicYear);
router.put('/:id', requireAuth, requireRole('admin'), updateAcademicYear);
router.delete('/:id', requireAuth, requireRole('admin'), deleteAcademicYear);

export default router;
