// controllers/subjectController.js
import Subject from '../models/Subject.js';

/* Helpers */
function sanitize(str) {
  return String(str ?? '').trim();
}
function asNullableString(v) {
  const s = sanitize(v);
  return s.length ? s : null;
}

/* GET /subjects */
export async function getSubjects(req, res) {
  try {
    const subjects = await Subject.findAll({ order: [['id', 'ASC']] });
    return res.json({ ok: true, data: subjects });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil data mata pelajaran',
      error: err.message,
    });
  }
}

/* GET /subjects/:id */
export async function getSubjectById(req, res) {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject)
      return res
        .status(404)
        .json({ ok: false, msg: 'Mata pelajaran tidak ditemukan' });

    return res.json({ ok: true, data: subject });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil data mata pelajaran',
      error: err.message,
    });
  }
}

/* POST /subjects */
export async function createSubject(req, res) {
  try {
    const code = asNullableString(req.body?.code);
    const name = sanitize(req.body?.name);
    const description = asNullableString(req.body?.description);

    // Validasi
    if (!name)
      return res
        .status(422)
        .json({ ok: false, msg: 'Nama mata pelajaran wajib diisi' });
    if (name.length > 120)
      return res
        .status(422)
        .json({ ok: false, msg: 'Nama maksimal 120 karakter' });
    if (code && code.length > 32)
      return res
        .status(422)
        .json({ ok: false, msg: 'Kode maksimal 32 karakter' });

    const subject = await Subject.create({ code, name, description });

    return res.status(201).json({
      ok: true,
      msg: 'Mata pelajaran berhasil dibuat',
      data: subject,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      // Unik di model: code & name
      const fields = Object.keys(err?.fields ?? {});
      const which = fields.includes('code')
        ? 'Kode mata pelajaran sudah digunakan'
        : fields.includes('name')
        ? 'Nama mata pelajaran sudah digunakan'
        : 'Data sudah ada';
      return res.status(409).json({ ok: false, msg: which });
    }
    return res.status(500).json({
      ok: false,
      msg: 'Gagal membuat mata pelajaran',
      error: err.message,
    });
  }
}

/* PUT/PATCH /subjects/:id */
export async function updateSubject(req, res) {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject)
      return res
        .status(404)
        .json({ ok: false, msg: 'Mata pelajaran tidak ditemukan' });

    // Ambil nilai yang dikirim saja (mendukung PATCH)
    const payload = {};

    if ('code' in req.body) {
      const code = asNullableString(req.body.code);
      if (code && code.length > 32)
        return res
          .status(422)
          .json({ ok: false, msg: 'Kode maksimal 32 karakter' });
      payload.code = code; // boleh null (karena allowNull: true)
    }

    if ('name' in req.body) {
      const name = sanitize(req.body.name);
      if (!name)
        return res
          .status(422)
          .json({ ok: false, msg: 'Nama mata pelajaran wajib diisi' });
      if (name.length > 120)
        return res
          .status(422)
          .json({ ok: false, msg: 'Nama maksimal 120 karakter' });
      payload.name = name;
    }

    if ('description' in req.body) {
      payload.description = asNullableString(req.body.description);
    }

    Object.assign(subject, payload);
    await subject.save();

    return res.json({
      ok: true,
      msg: 'Mata pelajaran berhasil diperbarui',
      data: subject,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      const fields = Object.keys(err?.fields ?? {});
      const which = fields.includes('code')
        ? 'Kode mata pelajaran sudah digunakan'
        : fields.includes('name')
        ? 'Nama mata pelajaran sudah digunakan'
        : 'Data sudah ada';
      return res.status(409).json({ ok: false, msg: which });
    }
    return res.status(500).json({
      ok: false,
      msg: 'Gagal memperbarui mata pelajaran',
      error: err.message,
    });
  }
}

/* DELETE /subjects/:id */
export async function deleteSubject(req, res) {
  try {
    const { id } = req.params;
    const subject = await Subject.findByPk(id);
    if (!subject)
      return res
        .status(404)
        .json({ ok: false, msg: 'Mata pelajaran tidak ditemukan' });

    await subject.destroy();
    return res.json({ ok: true, msg: 'Mata pelajaran berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal menghapus mata pelajaran',
      error: err.message,
    });
  }
}
