// controllers/classController.js
import { Op } from 'sequelize';
import Class from '../models/Class.js';
import User from '../models/User.js';

/* Helpers */
function s(v) {
  return String(v ?? '').trim();
}
function isEmpty(v) {
  return s(v).length === 0;
}
function normGrade(g) {
  const x = s(g).toUpperCase();
  if (['VII', 'VIII', 'IX'].includes(x)) return x;
  return '';
}
function limitLen(str, max) {
  return s(str).slice(0, max);
}

/* GET /classes?grade_level=VII&section=A&teacher_id=123 */
export async function getClasses(req, res) {
  try {
    const { grade_level, section, teacher_id, q } = req.query;
    const where = {};

    if (grade_level) where.grade_level = normGrade(grade_level);
    if (section) where.section = s(section);
    if (teacher_id) where.homeroom_teacher_id = Number(teacher_id);
    if (q && s(q)) {
      where.name = { [Op.like]: `%${s(q)}%` };
    }

    const rows = await Class.findAll({
      where,
      order: [
        ['grade_level', 'ASC'],
        ['section', 'ASC'],
      ],
      include: [
        {
          model: User,
          as: 'homeroom_teacher',
          attributes: [
            'id',
            'full_name',
            'username',
            'phone',
            'status',
            'role_id',
          ],
        },
      ],
    });

    return res.json({ ok: true, data: rows });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil data kelas',
      error: err.message,
    });
  }
}

/* GET /classes/:id */
export async function getClassById(req, res) {
  try {
    const { id } = req.params;
    const row = await Class.findByPk(id, {
      include: [
        {
          model: User,
          as: 'homeroom_teacher',
          attributes: [
            'id',
            'full_name',
            'username',
            'phone',
            'status',
            'role_id',
          ],
        },
      ],
    });
    if (!row)
      return res.status(404).json({ ok: false, msg: 'Kelas tidak ditemukan' });

    return res.json({ ok: true, data: row });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil kelas',
      error: err.message,
    });
  }
}

/* POST /classes */
export async function createClass(req, res) {
  try {
    const grade_level = normGrade(req.body?.grade_level);
    const section = limitLen(req.body?.section, 16);
    const name = limitLen(req.body?.name, 64);
    const homeroom_teacher_id =
      req.body?.homeroom_teacher_id != null
        ? Number(req.body.homeroom_teacher_id)
        : null;

    // Validasi
    if (!grade_level)
      return res.status(422).json({
        ok: false,
        msg: "grade_level wajib diisi salah satu dari: 'VII', 'VIII', 'IX'",
      });

    if (isEmpty(section))
      return res
        .status(422)
        .json({ ok: false, msg: 'section wajib diisi (maks 16 karakter)' });

    if (isEmpty(name))
      return res
        .status(422)
        .json({ ok: false, msg: 'name wajib diisi (maks 64 karakter)' });

    if (homeroom_teacher_id) {
      const teacher = await User.findByPk(homeroom_teacher_id);
      if (!teacher)
        return res
          .status(404)
          .json({ ok: false, msg: 'Wali kelas (user) tidak ditemukan' });
      if (teacher.status !== 'active') {
        return res
          .status(422)
          .json({ ok: false, msg: 'Wali kelas harus berstatus active' });
      }
      // Jika ingin ketat peran guru, boleh aktifkan validasi role di sini:
      // const role = await Role.findByPk(teacher.role_id);
      // if (!role || role.name !== 'teacher') { ... }
    }

    const created = await Class.create({
      grade_level,
      section,
      name,
      homeroom_teacher_id,
    });

    return res
      .status(201)
      .json({ ok: true, msg: 'Kelas berhasil dibuat', data: created });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(409)
        .json({ ok: false, msg: 'Nama kelas sudah digunakan' });
    }
    return res.status(500).json({
      ok: false,
      msg: 'Gagal membuat kelas',
      error: err.message,
    });
  }
}

/* PUT/PATCH /classes/:id */
export async function updateClass(req, res) {
  try {
    const { id } = req.params;
    const row = await Class.findByPk(id);
    if (!row)
      return res.status(404).json({ ok: false, msg: 'Kelas tidak ditemukan' });

    const payload = {};

    if ('grade_level' in req.body) {
      const g = normGrade(req.body.grade_level);
      if (!g)
        return res.status(422).json({
          ok: false,
          msg: "grade_level wajib 'VII' | 'VIII' | 'IX'",
        });
      payload.grade_level = g;
    }

    if ('section' in req.body) {
      const sec = limitLen(req.body.section, 16);
      if (isEmpty(sec))
        return res
          .status(422)
          .json({ ok: false, msg: 'section wajib diisi (maks 16 karakter)' });
      payload.section = sec;
    }

    if ('name' in req.body) {
      const n = limitLen(req.body.name, 64);
      if (isEmpty(n))
        return res
          .status(422)
          .json({ ok: false, msg: 'name wajib diisi (maks 64 karakter)' });
      payload.name = n;
    }

    if ('homeroom_teacher_id' in req.body) {
      const tid =
        req.body.homeroom_teacher_id != null
          ? Number(req.body.homeroom_teacher_id)
          : null;

      if (tid) {
        const teacher = await User.findByPk(tid);
        if (!teacher)
          return res
            .status(404)
            .json({ ok: false, msg: 'Wali kelas (user) tidak ditemukan' });
        if (teacher.status !== 'active') {
          return res
            .status(422)
            .json({ ok: false, msg: 'Wali kelas harus berstatus active' });
        }
      }
      payload.homeroom_teacher_id = tid; // boleh null untuk hapus wali kelas
    }

    Object.assign(row, payload);
    await row.save();

    return res.json({
      ok: true,
      msg: 'Kelas berhasil diperbarui',
      data: row,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(409)
        .json({ ok: false, msg: 'Nama kelas sudah digunakan' });
    }
    return res.status(500).json({
      ok: false,
      msg: 'Gagal memperbarui kelas',
      error: err.message,
    });
  }
}

/* DELETE /classes/:id */
export async function deleteClass(req, res) {
  try {
    const { id } = req.params;
    const row = await Class.findByPk(id);
    if (!row)
      return res.status(404).json({ ok: false, msg: 'Kelas tidak ditemukan' });

    await row.destroy();
    return res.json({ ok: true, msg: 'Kelas berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal menghapus kelas',
      error: err.message,
    });
  }
}
