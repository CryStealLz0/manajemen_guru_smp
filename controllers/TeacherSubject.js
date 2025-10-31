// controllers/teacherSubjectController.js
import { Op } from 'sequelize';
import db from '../config/Database.js';
import TeacherSubject from '../models/TeacherSubject.js';
import User from '../models/User.js';
import Subject from '../models/Subject.js';

/* Helpers */
const toInt = (v) => Number.parseInt(v, 10);
const isValidId = (v) => Number.isInteger(toInt(v)) && toInt(v) > 0;

async function ensureTeacherExists(id) {
  const row = await User.findByPk(id);
  return row && row.status === 'active' ? row : null; // minimal aktif
}
async function ensureSubjectExists(id) {
  const row = await Subject.findByPk(id);
  return row || null;
}

/**
 * GET /teacher-subjects?teacher_id=&subject_id=
 * Daftar mapping pivot (bisa difilter)
 */
export async function getTeacherSubjects(req, res) {
  try {
    const { teacher_id, subject_id } = req.query;
    const where = {};
    if (teacher_id) where.teacher_id = toInt(teacher_id);
    if (subject_id) where.subject_id = toInt(subject_id);

    const rows = await TeacherSubject.findAll({
      where,
      order: [
        ['teacher_id', 'ASC'],
        ['subject_id', 'ASC'],
      ],
      // Pastikan di model ada relasi berikut (lihat catatan di bawah):
      // TeacherSubject.belongsTo(User, { as: 'teacher', foreignKey: 'teacher_id' });
      // TeacherSubject.belongsTo(Subject, { as: 'subject', foreignKey: 'subject_id' });
      include: [
        {
          model: User,
          as: 'teacher',
          attributes: ['id', 'full_name', 'username', 'status', 'role_id'],
        },
        { model: Subject, as: 'subject', attributes: ['id', 'code', 'name'] },
      ],
    });

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil data teacher-subject',
      error: err.message,
    });
  }
}

/**
 * GET /teacher-subjects/teachers/:teacher_id/subjects
 * Ambil semua mata pelajaran yang diampu oleh seorang guru
 */
export async function getSubjectsByTeacher(req, res) {
  try {
    const { teacher_id } = req.params;
    if (!isValidId(teacher_id)) {
      return res.status(422).json({ ok: false, msg: 'teacher_id tidak valid' });
    }

    const teacher = await User.findByPk(teacher_id, {
      include: [
        { model: Subject, as: 'subjects', attributes: ['id', 'code', 'name'] },
      ],
    });
    if (!teacher)
      return res.status(404).json({ ok: false, msg: 'Guru tidak ditemukan' });

    return res.json({ ok: true, data: teacher.subjects });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil subjects untuk guru',
      error: err.message,
    });
  }
}

/**
 * GET /teacher-subjects/subjects/:subject_id/teachers
 * Ambil semua guru pengampu untuk satu mata pelajaran
 */
export async function getTeachersBySubject(req, res) {
  try {
    const { subject_id } = req.params;
    if (!isValidId(subject_id)) {
      return res.status(422).json({ ok: false, msg: 'subject_id tidak valid' });
    }

    const subject = await Subject.findByPk(subject_id, {
      include: [
        {
          model: User,
          as: 'teachers',
          attributes: ['id', 'full_name', 'username', 'status', 'role_id'],
        },
      ],
    });
    if (!subject)
      return res
        .status(404)
        .json({ ok: false, msg: 'Mata pelajaran tidak ditemukan' });

    return res.json({ ok: true, data: subject.teachers });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil teachers untuk subject',
      error: err.message,
    });
  }
}

/**
 * POST /teacher-subjects
 * Body: { teacher_id, subject_id }
 * Tambah satu relasi guru ↔ subject
 */
export async function addTeacherSubject(req, res) {
  try {
    const teacher_id = toInt(req.body?.teacher_id);
    const subject_id = toInt(req.body?.subject_id);

    if (!isValidId(teacher_id) || !isValidId(subject_id)) {
      return res
        .status(422)
        .json({ ok: false, msg: 'teacher_id/subject_id tidak valid' });
    }

    const teacher = await ensureTeacherExists(teacher_id);
    if (!teacher)
      return res
        .status(404)
        .json({ ok: false, msg: 'Guru tidak ditemukan / tidak aktif' });

    const subject = await ensureSubjectExists(subject_id);
    if (!subject)
      return res
        .status(404)
        .json({ ok: false, msg: 'Mata pelajaran tidak ditemukan' });

    const created = await TeacherSubject.create({ teacher_id, subject_id });
    return res.status(201).json({
      ok: true,
      msg: 'Relasi guru ↔ mata pelajaran berhasil ditambahkan',
      data: created,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        ok: false,
        msg: 'Relasi sudah ada (teacher_id & subject_id duplikat)',
      });
    }
    return res.status(500).json({
      ok: false,
      msg: 'Gagal menambahkan relasi',
      error: err.message,
    });
  }
}

/**
 * DELETE /teacher-subjects
 * Body: { teacher_id, subject_id }
 * Hapus satu relasi guru ↔ subject
 */
export async function deleteTeacherSubject(req, res) {
  try {
    const teacher_id = toInt(req.body?.teacher_id);
    const subject_id = toInt(req.body?.subject_id);

    if (!isValidId(teacher_id) || !isValidId(subject_id)) {
      return res
        .status(422)
        .json({ ok: false, msg: 'teacher_id/subject_id tidak valid' });
    }

    const deleted = await TeacherSubject.destroy({
      where: { teacher_id, subject_id },
    });
    if (!deleted) {
      return res.status(404).json({ ok: false, msg: 'Relasi tidak ditemukan' });
    }

    return res.json({
      ok: true,
      msg: 'Relasi guru ↔ mata pelajaran berhasil dihapus',
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal menghapus relasi',
      error: err.message,
    });
  }
}

/**
 * PUT /teacher-subjects/teachers/:teacher_id/subjects
 * Body: { subject_ids: number[] }
 * Replace semua subjects milik seorang guru (idempotent, dengan transaksi)
 */
export async function setTeacherSubjects(req, res) {
  const t = await db.transaction();
  try {
    const { teacher_id } = req.params;
    const subject_ids = Array.isArray(req.body?.subject_ids)
      ? req.body.subject_ids.map(toInt)
      : [];

    if (!isValidId(teacher_id)) {
      await t.rollback();
      return res.status(422).json({ ok: false, msg: 'teacher_id tidak valid' });
    }
    if (subject_ids.some((id) => !isValidId(id))) {
      await t.rollback();
      return res
        .status(422)
        .json({ ok: false, msg: 'subject_ids berisi id tidak valid' });
    }

    const teacher = await ensureTeacherExists(toInt(teacher_id));
    if (!teacher) {
      await t.rollback();
      return res
        .status(404)
        .json({ ok: false, msg: 'Guru tidak ditemukan / tidak aktif' });
    }

    // Validasi semua subject ada
    if (subject_ids.length) {
      const found = await Subject.findAll({
        where: { id: { [Op.in]: subject_ids } },
        transaction: t,
      });
      if (found.length !== subject_ids.length) {
        await t.rollback();
        return res.status(422).json({
          ok: false,
          msg: 'Beberapa subject_id tidak ditemukan',
        });
      }
    }

    // Ambil mapping saat ini
    const current = await TeacherSubject.findAll({
      where: { teacher_id: toInt(teacher_id) },
      transaction: t,
    });
    const currentIds = new Set(current.map((r) => r.subject_id));
    const nextIds = new Set(subject_ids);

    const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
    const toDel = [...currentIds].filter((id) => !nextIds.has(id));

    if (toDel.length) {
      await TeacherSubject.destroy({
        where: {
          teacher_id: toInt(teacher_id),
          subject_id: { [Op.in]: toDel },
        },
        transaction: t,
      });
    }
    if (toAdd.length) {
      const payload = toAdd.map((sid) => ({
        teacher_id: toInt(teacher_id),
        subject_id: sid,
      }));
      await TeacherSubject.bulkCreate(payload, {
        transaction: t,
        fields: ['teacher_id', 'subject_id'],
        ignoreDuplicates: true,
      });
    }

    await t.commit();

    // Kembalikan daftar subject terbaru milik guru
    const teacherWithSubjects = await User.findByPk(teacher_id, {
      include: [
        { model: Subject, as: 'subjects', attributes: ['id', 'code', 'name'] },
      ],
    });

    return res.json({
      ok: true,
      msg: 'Daftar mata pelajaran guru berhasil diperbarui',
      data: teacherWithSubjects?.subjects ?? [],
    });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({
      ok: false,
      msg: 'Gagal menyetel subjects untuk guru',
      error: err.message,
    });
  }
}
