// controllers/classSubjectController.js
import { Op } from 'sequelize';
import db from '../config/Database.js';
import ClassSubject from '../models/ClassSubject.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';

/* Helpers */
const toInt = (v) => Number.parseInt(v, 10);
const isValidId = (v) => Number.isInteger(toInt(v)) && toInt(v) > 0;

async function ensureClassExists(id) {
  const row = await Class.findByPk(id);
  return !!row;
}
async function ensureSubjectExists(id) {
  const row = await Subject.findByPk(id);
  return !!row;
}

/**
 * GET /class-subjects?class_id=&subject_id=
 * Mengembalikan list mapping (pivot), bisa difilter.
 */
export async function getClassSubjects(req, res) {
  try {
    const { class_id, subject_id } = req.query;
    const where = {};
    if (class_id) where.class_id = toInt(class_id);
    if (subject_id) where.subject_id = toInt(subject_id);

    const rows = await ClassSubject.findAll({
      where,
      order: [
        ['class_id', 'ASC'],
        ['subject_id', 'ASC'],
      ],
      include: [
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'name', 'grade_level', 'section'],
        },
        { model: Subject, as: 'subject', attributes: ['id', 'code', 'name'] },
      ],
    });

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil data class-subject',
      error: err.message,
    });
  }
}

/**
 * GET /classes/:class_id/subjects
 * Ambil semua mata pelajaran milik suatu kelas.
 */
export async function getSubjectsByClass(req, res) {
  try {
    const { class_id } = req.params;
    if (!isValidId(class_id)) {
      return res.status(422).json({ ok: false, msg: 'class_id tidak valid' });
    }
    const rowClass = await Class.findByPk(class_id, {
      include: [
        { model: Subject, as: 'subjects', attributes: ['id', 'code', 'name'] },
      ],
    });
    if (!rowClass)
      return res.status(404).json({ ok: false, msg: 'Kelas tidak ditemukan' });

    return res.json({ ok: true, data: rowClass.subjects });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil subjects untuk kelas',
      error: err.message,
    });
  }
}

/**
 * GET /subjects/:subject_id/classes
 * Ambil semua kelas yang memiliki mata pelajaran tertentu.
 */
export async function getClassesBySubject(req, res) {
  try {
    const { subject_id } = req.params;
    if (!isValidId(subject_id)) {
      return res.status(422).json({ ok: false, msg: 'subject_id tidak valid' });
    }
    const rowSubject = await Subject.findByPk(subject_id, {
      include: [
        {
          model: Class,
          as: 'classes',
          attributes: ['id', 'name', 'grade_level', 'section'],
        },
      ],
    });
    if (!rowSubject)
      return res
        .status(404)
        .json({ ok: false, msg: 'Mata pelajaran tidak ditemukan' });

    return res.json({ ok: true, data: rowSubject.classes });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil classes untuk subject',
      error: err.message,
    });
  }
}

/**
 * POST /class-subjects
 * Body: { class_id, subject_id }
 * Tambah satu relasi kelas ↔ subject.
 */
export async function addClassSubject(req, res) {
  try {
    const class_id = toInt(req.body?.class_id);
    const subject_id = toInt(req.body?.subject_id);

    if (!isValidId(class_id) || !isValidId(subject_id)) {
      return res
        .status(422)
        .json({ ok: false, msg: 'class_id/subject_id tidak valid' });
    }

    if (!(await ensureClassExists(class_id))) {
      return res.status(404).json({ ok: false, msg: 'Kelas tidak ditemukan' });
    }
    if (!(await ensureSubjectExists(subject_id))) {
      return res
        .status(404)
        .json({ ok: false, msg: 'Mata pelajaran tidak ditemukan' });
    }

    const created = await ClassSubject.create({ class_id, subject_id });
    return res.status(201).json({
      ok: true,
      msg: 'Relasi kelas ↔ mata pelajaran berhasil ditambahkan',
      data: created,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        ok: false,
        msg: 'Relasi sudah ada (class_id & subject_id duplikat)',
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
 * DELETE /class-subjects
 * Body: { class_id, subject_id }
 * Hapus satu relasi kelas ↔ subject.
 */
export async function deleteClassSubject(req, res) {
  try {
    const class_id = toInt(req.body?.class_id);
    const subject_id = toInt(req.body?.subject_id);

    if (!isValidId(class_id) || !isValidId(subject_id)) {
      return res
        .status(422)
        .json({ ok: false, msg: 'class_id/subject_id tidak valid' });
    }

    const deleted = await ClassSubject.destroy({
      where: { class_id, subject_id },
    });
    if (!deleted) {
      return res.status(404).json({ ok: false, msg: 'Relasi tidak ditemukan' });
    }

    return res.json({
      ok: true,
      msg: 'Relasi kelas ↔ mata pelajaran berhasil dihapus',
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
 * PUT /classes/:class_id/subjects
 * Body: { subject_ids: number[] }
 * Replace semua subjects untuk sebuah kelas (idempotent, pakai transaksi).
 */
export async function setClassSubjects(req, res) {
  const t = await db.transaction();
  try {
    const { class_id } = req.params;
    const subject_ids = Array.isArray(req.body?.subject_ids)
      ? req.body.subject_ids.map(toInt)
      : [];

    if (!isValidId(class_id)) {
      await t.rollback();
      return res.status(422).json({ ok: false, msg: 'class_id tidak valid' });
    }
    if (subject_ids.some((id) => !isValidId(id))) {
      await t.rollback();
      return res
        .status(422)
        .json({ ok: false, msg: 'subject_ids berisi id tidak valid' });
    }

    // Cek kelas
    const existsClass = await ensureClassExists(toInt(class_id));
    if (!existsClass) {
      await t.rollback();
      return res.status(404).json({ ok: false, msg: 'Kelas tidak ditemukan' });
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

    // Ambil yang sekarang
    const current = await ClassSubject.findAll({
      where: { class_id: toInt(class_id) },
      transaction: t,
    });
    const currentIds = new Set(current.map((r) => r.subject_id));
    const nextIds = new Set(subject_ids);

    // Hitung diff
    const toAdd = [...nextIds].filter((id) => !currentIds.has(id));
    const toDel = [...currentIds].filter((id) => !nextIds.has(id));

    if (toDel.length) {
      await ClassSubject.destroy({
        where: { class_id: toInt(class_id), subject_id: { [Op.in]: toDel } },
        transaction: t,
      });
    }
    if (toAdd.length) {
      const payload = toAdd.map((sid) => ({
        class_id: toInt(class_id),
        subject_id: sid,
      }));
      await ClassSubject.bulkCreate(payload, {
        transaction: t,
        fields: ['class_id', 'subject_id'],
        ignoreDuplicates: true, // jaga-jaga bila idempotent dipanggil lagi
      });
    }

    await t.commit();

    // Kembalikan daftar subjects terbaru
    const kelas = await Class.findByPk(class_id, {
      include: [
        { model: Subject, as: 'subjects', attributes: ['id', 'code', 'name'] },
      ],
    });

    return res.json({
      ok: true,
      msg: 'Daftar mata pelajaran kelas berhasil diperbarui',
      data: kelas?.subjects ?? [],
    });
  } catch (err) {
    await t.rollback();
    return res.status(500).json({
      ok: false,
      msg: 'Gagal menyetel subjects untuk kelas',
      error: err.message,
    });
  }
}
