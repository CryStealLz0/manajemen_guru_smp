// seed-timetables.js
import 'dotenv/config.js';
import { db } from '../../models/index.js';
import Timetable from '../../models/Timetable.js';
import Class from '../../models/Class.js';
import Semester from '../../models/Semester.js';
import Period from '../../models/Period.js';
import Subject from '../../models/Subject.js';
import User from '../../models/User.js';
import Room from '../../models/Room.js';
import TeacherSubject from '../../models/TeacherSubject.js';
import ClassSubject from '../../models/ClassSubject.js';

(async () => {
  const tx = await db.transaction();
  try {
    // --- Load data dasar
    const [classes, semesters, periods, subjects, teachers, rooms] =
      await Promise.all([
        Class.findAll({ transaction: tx }),
        Semester.findAll({ order: [['id', 'ASC']], transaction: tx }),
        Period.findAll({ order: [['start_time', 'ASC']], transaction: tx }),
        Subject.findAll({ transaction: tx }),
        User.findAll({ where: { status: 'active' }, transaction: tx }),
        Room.findAll({ transaction: tx }),
      ]);

    if (
      !classes.length ||
      !semesters.length ||
      !periods.length ||
      !subjects.length ||
      !teachers.length
    ) {
      console.log(
        '⚠️ Data (kelas/semester/periode/subject/guru) belum lengkap.',
      );
      await tx.rollback();
      process.exit(1);
    }

    const semester = semesters[0]; // pakai semester pertama
    const [classSubjects, teacherSubjects] = await Promise.all([
      ClassSubject.findAll({ transaction: tx }),
      TeacherSubject.findAll({ transaction: tx }),
    ]);

    // Helper: guru yg bisa mengajar subject_id
    const teachersBySubject = new Map(); // subject_id -> Set(teacher_id)
    for (const ts of teacherSubjects) {
      if (!teachersBySubject.has(ts.subject_id))
        teachersBySubject.set(ts.subject_id, new Set());
      teachersBySubject.get(ts.subject_id).add(ts.teacher_id);
    }

    // Helper: subjects per class
    const subjectsByClass = new Map(); // class_id -> number[]
    for (const cs of classSubjects) {
      if (!subjectsByClass.has(cs.class_id))
        subjectsByClass.set(cs.class_id, []);
      subjectsByClass.get(cs.class_id).push(cs.subject_id);
    }

    // Bersihkan jadwal lama (opsional & idempotent)
    await Timetable.destroy({
      where: { semester_id: semester.id },
      transaction: tx,
    });

    // ——————————————————————————————————————————————————————
    // Anti-bentrok per slot (day, period):
    // - usedTeachers[day][period] = Set of teacher_id
    // - usedRooms[day][period] = Set of room_id
    // ——————————————————————————————————————————————————————
    const dayRange = [1, 2, 3, 4, 5]; // Senin–Jumat
    const dayPeriodKey = (d, p) => `${d}:${p}`;
    const usedTeachers = new Map(); // key -> Set()
    const usedRooms = new Map(); // key -> Set()
    const firstSixPeriods = periods.slice(0, 6);

    const insertRows = [];
    let rotateRoomIdx = 0;

    // Untuk rotasi adil: index mapel per kelas dan index guru per subject
    const subjectCursor = new Map(); // class_id -> idx
    const teacherCursor = new Map(); // subject_id -> idx
    const roomIds = rooms.length ? rooms.map((r) => r.id) : [null];

    for (const cls of classes) {
      const clsSubjects = subjectsByClass.get(cls.id) || [];
      if (!clsSubjects.length) {
        console.log(
          `ℹ Kelas ${cls.name} belum punya daftar mata pelajaran, dilewati.`,
        );
        continue;
      }
      subjectCursor.set(cls.id, 0);

      for (const day of dayRange) {
        for (const per of firstSixPeriods) {
          const slotKey = dayPeriodKey(day, per.id);
          if (!usedTeachers.has(slotKey)) usedTeachers.set(slotKey, new Set());
          if (!usedRooms.has(slotKey)) usedRooms.set(slotKey, new Set());

          // Ambil subject untuk kelas ini (rotasi)
          const sIdx = subjectCursor.get(cls.id) % clsSubjects.length;
          let subjectId = clsSubjects[sIdx];
          subjectCursor.set(cls.id, sIdx + 1);

          // Cari guru yang mengampu subject tersebut dan belum terpakai di slot ini
          const teacherPool = Array.from(
            teachersBySubject.get(subjectId) || [],
          );
          if (!teacherPool.length) {
            // coba geser subject beberapa kali jika tidak ada guru tersedia
            let foundAlt = false;
            for (let shift = 1; shift < clsSubjects.length; shift++) {
              const tryId = clsSubjects[(sIdx + shift) % clsSubjects.length];
              const pool = Array.from(teachersBySubject.get(tryId) || []);
              if (pool.length) {
                subjectId = tryId;
                foundAlt = true;
                break;
              }
            }
            if (!foundAlt) continue; // tidak ada guru utk mapel2 kelas ini -> skip slot
          }

          // Rotasi guru dengan menghindari bentrok di slot
          let teacherId = null;
          const startIdx = teacherCursor.get(subjectId) || 0;
          for (let i = 0; i < teacherPool.length; i++) {
            const pick = teacherPool[(startIdx + i) % teacherPool.length];
            if (!usedTeachers.get(slotKey).has(pick)) {
              teacherId = pick;
              teacherCursor.set(
                subjectId,
                (startIdx + i + 1) % teacherPool.length,
              );
              break;
            }
          }
          if (!teacherId) {
            // semua guru subject itu sudah kepakai di slot ini -> coba subject lain
            let foundAlt = false;
            for (let shift = 1; shift < clsSubjects.length; shift++) {
              const trySubj = clsSubjects[(sIdx + shift) % clsSubjects.length];
              const pool = Array.from(teachersBySubject.get(trySubj) || []);
              for (let j = 0; j < pool.length; j++) {
                const pick = pool[j];
                if (!usedTeachers.get(slotKey).has(pick)) {
                  subjectId = trySubj;
                  teacherId = pick;
                  teacherCursor.set(trySubj, (j + 1) % pool.length);
                  foundAlt = true;
                  break;
                }
              }
              if (foundAlt) break;
            }
            if (!foundAlt) continue; // tetap buntu -> skip slot
          }

          // Pilih ruangan yang belum terpakai di slot (kalau tak ada, null)
          let roomId = null;
          for (let rTry = 0; rTry < roomIds.length; rTry++) {
            const pick = roomIds[(rotateRoomIdx + rTry) % roomIds.length];
            if (pick == null || !usedRooms.get(slotKey).has(pick)) {
              roomId = pick;
              rotateRoomIdx = (rotateRoomIdx + rTry + 1) % roomIds.length;
              break;
            }
          }

          // Tandai terpakai di slot ini
          usedTeachers.get(slotKey).add(teacherId);
          if (roomId != null) usedRooms.get(slotKey).add(roomId);

          insertRows.push({
            class_id: cls.id,
            semester_id: semester.id,
            day_of_week: day,
            period_id: per.id,
            subject_id: subjectId,
            teacher_id: teacherId,
            room_id: roomId, // boleh null
            notes: null,
          });
        }
      }
    }

    // Insert
    if (!insertRows.length) {
      console.log(
        '⚠️ Tidak ada baris jadwal yang bisa dibuat (cek data mapping guru/kelas-mapel).',
      );
      await tx.rollback();
      process.exit(1);
    }

    await Timetable.bulkCreate(insertRows, {
      transaction: tx,
      fields: [
        'class_id',
        'semester_id',
        'day_of_week',
        'period_id',
        'subject_id',
        'teacher_id',
        'room_id',
        'notes',
      ],
    });

    await tx.commit();
    console.log(
      `✅ Seed timetables selesai! Total baris dibuat: ${insertRows.length}`,
    );
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed timetables gagal:', err);
    process.exit(1);
  }
})();
