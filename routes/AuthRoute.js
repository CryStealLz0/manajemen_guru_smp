import express from 'express';
import { login, me, logout } from '../controllers/Auth.js';
import { requireAuth } from '../middleware/Auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
