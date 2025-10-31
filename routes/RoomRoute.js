import express from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
} from '../controllers/Room.js';

import {
  requireAuth,
  requireRole,
  ensureActiveUser,
} from '../middleware/Middleware.js';

const router = express.Router();

// Proteksi dasar semua endpoint
router.use(requireAuth, ensureActiveUser);

// Hanya admin yang boleh mengelola data ruangan
router.get('/', requireRole('admin'), getRooms);
router.get('/:id', requireRole('admin'), getRoomById);
router.post('/', requireRole('admin'), createRoom);
router.put('/:id', requireRole('admin'), updateRoom);
router.delete('/:id', requireRole('admin'), deleteRoom);

export default router;
