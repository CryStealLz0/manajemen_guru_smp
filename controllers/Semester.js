// controllers/semesterController.js
import { Op } from 'sequelize';
import Semester from '../models/Semester.js';
import AcademicYear from '../models/AcademicYear.js';

/* Helpers */
function sanitize(v) {
  return String(v ?? '').trim();
}

function normalizeName(n) {
  const s = sanitize(n).toLowerCase();
  if (s === 'ganjil') return 'Ganjil';
  if (s === 'genap') return 'Genap';
  return '';
}

function isValidDateOnly(str) {
  // Format YYYY-MM-DD & valid date
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(str);
  return !Number.isNaN(d.getTime());
}

/* GET /semesters?academic_year_id=.. */
export async function getSemesters(req, res) {
  try {
    const { academic_year_id } = req.query;
    const where = {};
    if (academic_year_id) where.academic_year_id = Number(academic_year_id);

    const rows = await Semester.findAll({
      where,
      order: [
        ['academic_year_id', 'ASC'],
        ['id', 'ASC'],
      ],
    });

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil data semester',
      error: err.message,
    });
  }
}

/* GET /semesters/:id */
export async function getSemesterById(req, res) {
  try {
    const { id } = req.params;
    const row = await Semester.findByPk(id);
    if (!row)
      return res
        .status(404)
        .json({ ok: false, msg: 'Semester tidak ditemukan' });
    return res.json({ ok: true, data: row });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil semester',
      error: err.message,
    });
  }
}

/* POST /semesters */
export async function createSemester(req, res) {
  console.log('Create semester request body:', req.body);
  try {
    const academic_year_id = Number(req.body?.academic_year_id);
    const name = normalizeName(req.body?.name);
    const start_date = sanitize(req.body?.start_date);
    const end_date = sanitize(req.body?.end_date);

    // Validasi basic
    if (!academic_year_id)
      return res
        .status(422)
        .json({ ok: false, msg: 'academic_year_id wajib diisi' });

    if (!name || !['Ganjil', 'Genap'].includes(name))
      return res
        .status(422)
        .json({ ok: false, msg: "name wajib 'Ganjil' atau 'Genap'" });

    if (!isValidDateOnly(start_date) || !isValidDateOnly(end_date))
      return res.status(422).json({
        ok: false,
        msg: 'start_date dan end_date wajib format YYYY-MM-DD yang valid',
      });

    if (new Date(start_date) > new Date(end_date))
      return res.status(422).json({
        ok: false,
        msg: 'start_date tidak boleh lebih besar dari end_date',
      });

    // Pastikan AcademicYear ada
    const ay = await AcademicYear.findByPk(academic_year_id);
    if (!ay)
      return res
        .status(404)
        .json({ ok: false, msg: 'Academic year tidak ditemukan' });

    const created = await Semester.create({
      academic_year_id,
      name,
      start_date,
      end_date,
    });

    return res.status(201).json({
      ok: true,
      msg: 'Semester berhasil dibuat',
      data: created,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      // Index unik: (academic_year_id, name)
      return res.status(409).json({
        ok: false,
        msg: 'Semester dengan nama tersebut sudah ada pada tahun ajaran ini',
      });
    }
    return res.status(500).json({
      ok: false,
      msg: 'Gagal membuat semester',
      error: err.message,
    });
  }
}

/* PUT/PATCH /semesters/:id */
export async function updateSemester(req, res) {
  try {
    const { id } = req.params;
    const row = await Semester.findByPk(id);
    if (!row)
      return res
        .status(404)
        .json({ ok: false, msg: 'Semester tidak ditemukan' });

    const payload = {};

    if ('academic_year_id' in req.body) {
      const academic_year_id = Number(req.body.academic_year_id);
      if (!academic_year_id)
        return res
          .status(422)
          .json({ ok: false, msg: 'academic_year_id wajib diisi' });
      const ay = await AcademicYear.findByPk(academic_year_id);
      if (!ay)
        return res
          .status(404)
          .json({ ok: false, msg: 'Academic year tidak ditemukan' });
      payload.academic_year_id = academic_year_id;
    }

    if ('name' in req.body) {
      const name = normalizeName(req.body.name);
      if (!name || !['Ganjil', 'Genap'].includes(name))
        return res
          .status(422)
          .json({ ok: false, msg: "name wajib 'Ganjil' atau 'Genap'" });
      payload.name = name;
    }

    if ('start_date' in req.body) {
      const d = sanitize(req.body.start_date);
      if (!isValidDateOnly(d))
        return res.status(422).json({
          ok: false,
          msg: 'start_date wajib format YYYY-MM-DD yang valid',
        });
      payload.start_date = d;
    }

    if ('end_date' in req.body) {
      const d = sanitize(req.body.end_date);
      if (!isValidDateOnly(d))
        return res.status(422).json({
          ok: false,
          msg: 'end_date wajib format YYYY-MM-DD yang valid',
        });
      payload.end_date = d;
    }

    // Cek konsistensi tanggal bila salah satu/begge diganti
    const nextStart =
      'start_date' in payload ? payload.start_date : row.start_date;
    const nextEnd = 'end_date' in payload ? payload.end_date : row.end_date;
    if (new Date(nextStart) > new Date(nextEnd)) {
      return res.status(422).json({
        ok: false,
        msg: 'start_date tidak boleh lebih besar dari end_date',
      });
    }

    Object.assign(row, payload);
    await row.save();

    return res.json({
      ok: true,
      msg: 'Semester berhasil diperbarui',
      data: row,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({
        ok: false,
        msg: 'Semester dengan nama tersebut sudah ada pada tahun ajaran ini',
      });
    }
    return res.status(500).json({
      ok: false,
      msg: 'Gagal memperbarui semester',
      error: err.message,
    });
  }
}

/* DELETE /semesters/:id */
export async function deleteSemester(req, res) {
  try {
    const { id } = req.params;
    const row = await Semester.findByPk(id);
    if (!row)
      return res
        .status(404)
        .json({ ok: false, msg: 'Semester tidak ditemukan' });

    await row.destroy();
    return res.json({ ok: true, msg: 'Semester berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal menghapus semester',
      error: err.message,
    });
  }
}
