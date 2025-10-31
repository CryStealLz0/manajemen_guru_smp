// controllers/timetableController.js
import { Op } from 'sequelize';
import Timetable from '../models/Timetable.js';
import Class from '../models/Class.js';
import Semester from '../models/Semester.js';
import Period from '../models/Period.js';
import Subject from '../models/Subject.js';
import User from '../models/User.js';
import Room from '../models/Room.js';
import ClassSubject from '../models/ClassSubject.js';
import TeacherSubject from '../models/TeacherSubject.js';

/* Helpers */
const toInt = (v) => Number.parseInt(v, 10);
const isPosInt = (v) => Number.isInteger(toInt(v)) && toInt(v) > 0;
const isDow = (v) => isPosInt(v) && toInt(v) >= 1 && toInt(v) <= 7;
const trim = (s) => String(s ?? '').trim();

async function mustExist(Model, id, label) {
  const row = await Model.findByPk(id);
  if (!row) throw new Error(`${label} tidak ditemukan`);
  return row;
}

async function ensureClassHasSubject(class_id, subject_id) {
  const cs = await ClassSubject.findOne({ where: { class_id, subject_id } });
  if (!cs) throw new Error('Mata pelajaran belum terdaftar untuk kelas ini');
}

async function ensureTeacherTeachesSubject(teacher_id, subject_id) {
  const ts = await TeacherSubject.findOne({
    where: { teacher_id, subject_id },
  });
  if (!ts) throw new Error('Guru tersebut bukan pengampu mata pelajaran ini');
}

function mapUniqueError(err) {
  // MySQL biasanya menyertakan nama index di pesan error
  const msg = err?.parent?.sqlMessage || err?.message || '';
  if (msg.includes('uq_tt_class_slot'))
    return 'Slot bentrok: kelas sudah memiliki jadwal pada hari & periode tersebut';
  if (msg.includes('uq_tt_teacher_slot'))
    return 'Slot bentrok: guru sudah mengajar pada hari & periode tersebut';
  if (msg.includes('uq_tt_room_slot'))
    return 'Slot bentrok: ruangan sudah terpakai pada hari & periode tersebut';
  return 'Data duplikat / melanggar aturan unik';
}

/* ====== GET LIST / FILTER ======
   GET /timetables?class_id=&semester_id=&day_of_week=&teacher_id=&room_id=
*/
export async function getTimetables(req, res) {
  try {
    const { class_id, semester_id, day_of_week, teacher_id, room_id } =
      req.query;
    const where = {};
    if (class_id) where.class_id = toInt(class_id);
    if (semester_id) where.semester_id = toInt(semester_id);
    if (day_of_week) where.day_of_week = toInt(day_of_week);
    if (teacher_id) where.teacher_id = toInt(teacher_id);
    if (room_id) where.room_id = toInt(room_id);

    const rows = await Timetable.findAll({
      where,
      include: [
        { model: Class, attributes: ['id', 'name', 'grade_level', 'section'] },
        { model: Semester, attributes: ['id', 'name', 'academic_year_id'] },
        {
          model: Period,
          attributes: ['id', 'title', 'start_time', 'end_time'],
        },
        { model: Subject, attributes: ['id', 'code', 'name'] },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'full_name', 'username', 'status', 'role_id'],
        },
        { model: Room, attributes: ['id', 'name', 'location'] },
      ],
      order: [
        ['semester_id', 'ASC'],
        ['day_of_week', 'ASC'],
        [Period, 'start_time', 'ASC'],
      ],
    });

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res
      .status(500)
      .json({
        ok: false,
        msg: 'Gagal mengambil data jadwal',
        error: err.message,
      });
  }
}

/* ====== GET BY ID ======
   GET /timetables/:id
*/
export async function getTimetableById(req, res) {
  try {
    const { id } = req.params;
    const row = await Timetable.findByPk(id, {
      include: [
        { model: Class, attributes: ['id', 'name', 'grade_level', 'section'] },
        { model: Semester, attributes: ['id', 'name', 'academic_year_id'] },
        {
          model: Period,
          attributes: ['id', 'title', 'start_time', 'end_time'],
        },
        { model: Subject, attributes: ['id', 'code', 'name'] },
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'full_name', 'username', 'status', 'role_id'],
        },
        { model: Room, attributes: ['id', 'name', 'location'] },
      ],
    });
    if (!row)
      return res.status(404).json({ ok: false, msg: 'Jadwal tidak ditemukan' });
    return res.json({ ok: true, data: row });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, msg: 'Gagal mengambil jadwal', error: err.message });
  }
}

/* ====== CREATE ======
   POST /timetables
   Body: { class_id, semester_id, day_of_week, period_id, subject_id, teacher_id, room_id?, notes? }
*/
export async function createTimetable(req, res) {
  try {
    const class_id = toInt(req.body?.class_id);
    const semester_id = toInt(req.body?.semester_id);
    const day_of_week = toInt(req.body?.day_of_week);
    const period_id = toInt(req.body?.period_id);
    const subject_id = toInt(req.body?.subject_id);
    const teacher_id = toInt(req.body?.teacher_id);
    const room_id = req.body?.room_id != null ? toInt(req.body.room_id) : null;
    const notes = trim(req.body?.notes);

    // Validasi dasar
    if (
      ![class_id, semester_id, period_id, subject_id, teacher_id].every(
        isPosInt,
      )
    )
      return res
        .status(422)
        .json({
          ok: false,
          msg: 'class_id, semester_id, period_id, subject_id, teacher_id wajib diisi (bilangan bulat positif)',
        });

    if (!isDow(day_of_week))
      return res.status(422).json({ ok: false, msg: 'day_of_week harus 1..7' });

    if (room_id !== null && !isPosInt(room_id))
      return res.status(422).json({ ok: false, msg: 'room_id tidak valid' });

    // Cek FK ada
    await mustExist(Class, class_id, 'Kelas');
    await mustExist(Semester, semester_id, 'Semester');
    await mustExist(Period, period_id, 'Periode');
    await mustExist(Subject, subject_id, 'Mata pelajaran');
    const teacher = await mustExist(User, teacher_id, 'Guru');
    if (teacher.status !== 'active')
      return res
        .status(422)
        .json({ ok: false, msg: 'Guru harus berstatus active' });
    if (room_id) await mustExist(Room, room_id, 'Ruangan');

    // Cek relasi logis
    await ensureClassHasSubject(class_id, subject_id);
    await ensureTeacherTeachesSubject(teacher_id, subject_id);

    const created = await Timetable.create({
      class_id,
      semester_id,
      day_of_week,
      period_id,
      subject_id,
      teacher_id,
      room_id,
      notes: notes || null,
    });

    return res
      .status(201)
      .json({ ok: true, msg: 'Jadwal berhasil dibuat', data: created });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ ok: false, msg: mapUniqueError(err) });
    }
    // Error custom dari helper
    if (
      err?.message?.startsWith('Mata pelajaran') ||
      err?.message?.startsWith('Guru')
    ) {
      return res.status(422).json({ ok: false, msg: err.message });
    }
    if (err?.message?.endsWith('tidak ditemukan')) {
      return res.status(404).json({ ok: false, msg: err.message });
    }
    return res
      .status(500)
      .json({ ok: false, msg: 'Gagal membuat jadwal', error: err.message });
  }
}

/* ====== UPDATE ======
   PUT /timetables/:id
   Body: subset field di atas (partial update didukung)
*/
export async function updateTimetable(req, res) {
  try {
    const { id } = req.params;
    const row = await Timetable.findByPk(id);
    if (!row)
      return res.status(404).json({ ok: false, msg: 'Jadwal tidak ditemukan' });

    // Siapkan payload
    const payload = {};
    if ('class_id' in req.body) {
      const v = toInt(req.body.class_id);
      if (!isPosInt(v))
        return res.status(422).json({ ok: false, msg: 'class_id tidak valid' });
      await mustExist(Class, v, 'Kelas');
      payload.class_id = v;
    }
    if ('semester_id' in req.body) {
      const v = toInt(req.body.semester_id);
      if (!isPosInt(v))
        return res
          .status(422)
          .json({ ok: false, msg: 'semester_id tidak valid' });
      await mustExist(Semester, v, 'Semester');
      payload.semester_id = v;
    }
    if ('day_of_week' in req.body) {
      const v = toInt(req.body.day_of_week);
      if (!isDow(v))
        return res
          .status(422)
          .json({ ok: false, msg: 'day_of_week harus 1..7' });
      payload.day_of_week = v;
    }
    if ('period_id' in req.body) {
      const v = toInt(req.body.period_id);
      if (!isPosInt(v))
        return res
          .status(422)
          .json({ ok: false, msg: 'period_id tidak valid' });
      await mustExist(Period, v, 'Periode');
      payload.period_id = v;
    }
    if ('subject_id' in req.body) {
      const v = toInt(req.body.subject_id);
      if (!isPosInt(v))
        return res
          .status(422)
          .json({ ok: false, msg: 'subject_id tidak valid' });
      await mustExist(Subject, v, 'Mata pelajaran');
      payload.subject_id = v;
    }
    if ('teacher_id' in req.body) {
      const v = toInt(req.body.teacher_id);
      if (!isPosInt(v))
        return res
          .status(422)
          .json({ ok: false, msg: 'teacher_id tidak valid' });
      const teacher = await mustExist(User, v, 'Guru');
      if (teacher.status !== 'active')
        return res
          .status(422)
          .json({ ok: false, msg: 'Guru harus berstatus active' });
      payload.teacher_id = v;
    }
    if ('room_id' in req.body) {
      const v = req.body.room_id != null ? toInt(req.body.room_id) : null;
      if (v !== null && !isPosInt(v))
        return res.status(422).json({ ok: false, msg: 'room_id tidak valid' });
      if (v) await mustExist(Room, v, 'Ruangan');
      payload.room_id = v;
    }
    if ('notes' in req.body) {
      payload.notes = trim(req.body.notes) || null;
    }

    // Validasi relasi logis bila kombinasi terkait berubah
    const nextClassId = payload.class_id ?? row.class_id;
    const nextSubjectId = payload.subject_id ?? row.subject_id;
    const nextTeacherId = payload.teacher_id ?? row.teacher_id;
    if (payload.class_id || payload.subject_id) {
      await ensureClassHasSubject(nextClassId, nextSubjectId);
    }
    if (payload.teacher_id || payload.subject_id) {
      await ensureTeacherTeachesSubject(nextTeacherId, nextSubjectId);
    }

    Object.assign(row, payload);
    await row.save();

    return res.json({ ok: true, msg: 'Jadwal berhasil diperbarui', data: row });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ ok: false, msg: mapUniqueError(err) });
    }
    if (
      err?.message?.startsWith('Mata pelajaran') ||
      err?.message?.startsWith('Guru')
    ) {
      return res.status(422).json({ ok: false, msg: err.message });
    }
    if (err?.message?.endsWith('tidak ditemukan')) {
      return res.status(404).json({ ok: false, msg: err.message });
    }
    return res
      .status(500)
      .json({ ok: false, msg: 'Gagal memperbarui jadwal', error: err.message });
  }
}

/* ====== DELETE ======
   DELETE /timetables/:id
*/
export async function deleteTimetable(req, res) {
  try {
    const { id } = req.params;
    const row = await Timetable.findByPk(id);
    if (!row)
      return res.status(404).json({ ok: false, msg: 'Jadwal tidak ditemukan' });

    await row.destroy();
    return res.json({ ok: true, msg: 'Jadwal berhasil dihapus' });
  } catch (err) {
    return res
      .status(500)
      .json({ ok: false, msg: 'Gagal menghapus jadwal', error: err.message });
  }
}

/* ====== Convenience: Jadwal Harian Kelas ======
   GET /timetables/classes/:class_id/daily?semester_id=&day_of_week=
*/
export async function getClassDailySchedule(req, res) {
  try {
    const { class_id } = req.params;
    const semester_id = toInt(req.query?.semester_id);
    const day_of_week = toInt(req.query?.day_of_week);

    if (!isPosInt(class_id) || !isPosInt(semester_id) || !isDow(day_of_week)) {
      return res
        .status(422)
        .json({
          ok: false,
          msg: 'class_id, semester_id, day_of_week tidak valid',
        });
    }

    await mustExist(Class, toInt(class_id), 'Kelas');
    await mustExist(Semester, semester_id, 'Semester');

    const rows = await Timetable.findAll({
      where: { class_id: toInt(class_id), semester_id, day_of_week },
      include: [
        {
          model: Period,
          attributes: ['id', 'title', 'start_time', 'end_time'],
        },
        { model: Subject, attributes: ['id', 'code', 'name'] },
        { model: User, as: 'teacher', attributes: ['id', 'full_name'] },
        { model: Room, attributes: ['id', 'name'] },
      ],
      order: [[Period, 'start_time', 'ASC']],
    });

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res
      .status(500)
      .json({
        ok: false,
        msg: 'Gagal mengambil jadwal harian kelas',
        error: err.message,
      });
  }
}

/* ====== Convenience: Jadwal Harian Guru ======
   GET /timetables/teachers/:teacher_id/daily?semester_id=&day_of_week=
*/
export async function getTeacherDailySchedule(req, res) {
  try {
    const { teacher_id } = req.params;
    const semester_id = toInt(req.query?.semester_id);
    const day_of_week = toInt(req.query?.day_of_week);

    if (
      !isPosInt(teacher_id) ||
      !isPosInt(semester_id) ||
      !isDow(day_of_week)
    ) {
      return res
        .status(422)
        .json({
          ok: false,
          msg: 'teacher_id, semester_id, day_of_week tidak valid',
        });
    }

    await mustExist(User, toInt(teacher_id), 'Guru');
    await mustExist(Semester, semester_id, 'Semester');

    const rows = await Timetable.findAll({
      where: { teacher_id: toInt(teacher_id), semester_id, day_of_week },
      include: [
        {
          model: Period,
          attributes: ['id', 'title', 'start_time', 'end_time'],
        },
        { model: Subject, attributes: ['id', 'code', 'name'] },
        { model: Class, attributes: ['id', 'name', 'grade_level', 'section'] },
        { model: Room, attributes: ['id', 'name'] },
      ],
      order: [[Period, 'start_time', 'ASC']],
    });

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res
      .status(500)
      .json({
        ok: false,
        msg: 'Gagal mengambil jadwal harian guru',
        error: err.message,
      });
  }
}
