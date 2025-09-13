import express from 'express';
import cors from 'cors';
import session from 'express-session';
import dotenv from 'dotenv';
import db from './config/Database.js';
import connectSessionSequelize from 'connect-session-sequelize';
import AuthRoute from './routes/AuthRoute.js';
import UserRoute from './routes/UserRoute.js';
import { requireAuth, requireRole } from './middleware/Auth.js';
// import './models/index.js';

dotenv.config();

const app = express();

// (opsional) kalau di belakang reverse proxy / https
// app.set('trust proxy', 1);

const SequelizeStore = connectSessionSequelize(session.Store);
const store = new SequelizeStore({ db });

app.use(express.json());

app.use(
    cors({
        credentials: true, // <- perbaiki dari "credential"
        origin: 'http://localhost:3000',
    }),
);

app.use(
    session({
        secret: process.env.SESS_SECRET || 'dev-secret',
        resave: false,
        saveUninitialized: false,
        store,
        cookie: {
            secure: 'auto', // true jika https, auto cukup untuk lokal
            sameSite: 'lax',
            // maxAge: 24 * 60 * 60 * 1000, // 1 hari (opsional)
        },
    }),
);

app.use('/auth', AuthRoute);

// route users (CRUD user, admin only)
app.use('/users', UserRoute);

// contoh proteksi endpoint admin-only
app.get('/admin/ping', requireAuth, requireRole('admin'), (_req, res) => {
    res.json({ ok: true });
});

// contoh proteksi guru-only
app.get('/teacher/ping', requireAuth, requireRole('teacher'), (_req, res) => {
    res.json({ ok: true });
});

// Bootstrapping DB & start server
// (async () => {
//     try {
//         await db.authenticate();
//         console.log('DB connected.');

//         // Sinkronkan semua model aplikasi
//         await db.sync({ alter: true });
//         console.log('Models synced.');

//         // Buat tabel Sessions untuk session-store
//         await store.sync();
//         console.log('Session store synced.');

//         const port = Number(process.env.APP_PORT || 4000);
//         app.listen(port, () => {
//             console.log(`Server running on http://localhost:${port}`);
//         });
//     } catch (e) {
//         console.error('Boot error:', e);
//         // Jangan close db kalau gagal; biar pesan error terlihat
//         process.exit(1);
//     }
// })();

const port = Number(process.env.APP_PORT || 4000);
app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
