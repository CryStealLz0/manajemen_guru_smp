import express from 'express';
import session from 'express-session';
import SequelizeStoreInit from 'connect-session-sequelize';
import db from './config/Database.js';
import cors from 'cors';

const app = express();

const ALLOWLIST = ['http://localhost:5173', 'http://localhost:3000'];

// ✅ CORS: gunakan fungsi origin supaya gampang nambah host dev
app.use(
  cors({
    origin(origin, cb) {
      // Postman / curl / server-to-server tak punya Origin → izinkan
      if (!origin) return cb(null, true);
      return cb(null, ALLOWLIST.includes(origin));
    },
    credentials: true,
  }),
);

app.use(express.json());

// ✅ PROD di balik proxy/HTTPS → aktifkan ini (biar secure cookie kebaca)
// app.set('trust proxy', 1);

const SequelizeStore = SequelizeStoreInit(session.Store);
const store = new SequelizeStore({
  db,
  tableName: 'sessions',
  // ✅ bersih-bersih session kadaluarsa otomatis
  checkExpirationInterval: 15 * 60 * 1000, // setiap 15 menit
  expiration: 7 * 24 * 60 * 60 * 1000, // TTL session = 7 hari
});

// ✅ pastikan tabel "sessions" dibuat (kalau belum). Lakukan sekali saat boot.
store.sync(); // kalau kamu pakai top-level await, boleh: await store.sync()

app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-please-change',
    store,
    name: 'sid', // ✅ samakan dengan clearCookie di logout
    resave: false,
    saveUninitialized: false,
    rolling: true, // ✅ refresh maxAge pada tiap response (opsional, enak saat dev)
    cookie: {
      httpOnly: true,
      secure: false, // ✅ set true di PROD (HTTPS) + app.set('trust proxy', 1)
      sameSite: 'lax', // ✅ cocok untuk localhost:5173/3000 (masih 1 site: http+localhost)
      maxAge: 7 * 24 * 60 * 60 * 1000,
      // domain: '.yourdomain.com', // ❗️JANGAN di-set untuk localhost
    },
  }),
);

import authRoutes from './routes/AuthRoute.js';
import userRoutes from './routes/UserRoute.js';
import roleRoutes from './routes/RoleRoute.js';
import subjectRoutes from './routes/SubjectRoute.js';
import academicYearRoutes from './routes/AcademicYearRoute.js';
import semesterRoutes from './routes/SemesterRoute.js';
import classRoutes from './routes/ClassRoute.js';
import roomRoutes from './routes/RoomRoute.js';
import classSubjectRoutes from './routes/ClassSubjectRoute.js';
import teacherSubjectRoutes from './routes/TeacherSubjectRoute.js';
import timetableRoutes from './routes/TimetableRoute.js';
import periodRoutes from './routes/PeriodRoute.js';

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/roles', roleRoutes);
app.use('/subjects', subjectRoutes);
app.use('/academic-years', academicYearRoutes);
app.use('/semesters', semesterRoutes);
app.use('/classes', classRoutes);
app.use('/rooms', roomRoutes);
app.use('/periods', periodRoutes);

// Subject Relations
app.use('/class-subjects', classSubjectRoutes);
app.use('/teacher-subjects', teacherSubjectRoutes);
app.use('/timetables', timetableRoutes);

export { app, db, store };
