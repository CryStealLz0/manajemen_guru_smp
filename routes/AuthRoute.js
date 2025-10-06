import express from 'express';
import { login, me, logout } from '../controllers/Auth.js';
import { requireAuth } from '../middleware/Middleware.js';
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        ok: false,
        msg: 'Terlalu banyak percobaan login. Coba lagi nanti.',
    },
});

const router = express.Router();

router.post('/login', loginLimiter, login);
router.get('/me', me);
// router.get('/me', requireAuth, me);
router.post('/logout', requireAuth, logout);

export default router;
