import Period from '../models/Period.js';

/* Helper */
function s(v) {
  return String(v ?? '').trim();
}

function isValidTime(str) {
  // Format HH:mm atau HH:mm:ss (24 jam)
  return /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(str);
}

/* GET /periods */
export async function getPeriods(req, res) {
  try {
    const periods = await Period.findAll({ order: [['start_time', 'ASC']] });
    return res.json({ ok: true, data: periods });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil data jam pelajaran',
      error: err.message,
    });
  }
}

/* GET /periods/:id */
export async function getPeriodById(req, res) {
  try {
    const { id } = req.params;
    const period = await Period.findByPk(id);
    if (!period)
      return res
        .status(404)
        .json({ ok: false, msg: 'Jam pelajaran tidak ditemukan' });

    return res.json({ ok: true, data: period });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil jam pelajaran',
      error: err.message,
    });
  }
}

/* POST /periods */
export async function createPeriod(req, res) {
  try {
    const title = s(req.body?.title);
    const start_time = s(req.body?.start_time);
    const end_time = s(req.body?.end_time);

    if (!title)
      return res
        .status(422)
        .json({ ok: false, msg: 'Judul/jam pelajaran wajib diisi' });
    if (!isValidTime(start_time) || !isValidTime(end_time))
      return res.status(422).json({
        ok: false,
        msg: 'Format waktu tidak valid (gunakan HH:mm atau HH:mm:ss)',
      });
    if (start_time >= end_time)
      return res
        .status(422)
        .json({ ok: false, msg: 'Waktu mulai harus sebelum waktu selesai' });

    const created = await Period.create({ title, start_time, end_time });
    return res.status(201).json({
      ok: true,
      msg: 'Jam pelajaran berhasil dibuat',
      data: created,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal membuat jam pelajaran',
      error: err.message,
    });
  }
}

/* PUT /periods/:id */
export async function updatePeriod(req, res) {
  try {
    const { id } = req.params;
    const period = await Period.findByPk(id);
    if (!period)
      return res
        .status(404)
        .json({ ok: false, msg: 'Jam pelajaran tidak ditemukan' });

    const title = 'title' in req.body ? s(req.body.title) : period.title;
    const start_time =
      'start_time' in req.body ? s(req.body.start_time) : period.start_time;
    const end_time =
      'end_time' in req.body ? s(req.body.end_time) : period.end_time;

    if (!title)
      return res
        .status(422)
        .json({ ok: false, msg: 'Judul/jam pelajaran wajib diisi' });
    if (!isValidTime(start_time) || !isValidTime(end_time))
      return res.status(422).json({
        ok: false,
        msg: 'Format waktu tidak valid (gunakan HH:mm atau HH:mm:ss)',
      });
    if (start_time >= end_time)
      return res
        .status(422)
        .json({ ok: false, msg: 'Waktu mulai harus sebelum waktu selesai' });

    period.title = title;
    period.start_time = start_time;
    period.end_time = end_time;
    await period.save();

    return res.json({
      ok: true,
      msg: 'Jam pelajaran berhasil diperbarui',
      data: period,
    });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal memperbarui jam pelajaran',
      error: err.message,
    });
  }
}

/* DELETE /periods/:id */
export async function deletePeriod(req, res) {
  try {
    const { id } = req.params;
    const period = await Period.findByPk(id);
    if (!period)
      return res
        .status(404)
        .json({ ok: false, msg: 'Jam pelajaran tidak ditemukan' });

    await period.destroy();
    return res.json({ ok: true, msg: 'Jam pelajaran berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal menghapus jam pelajaran',
      error: err.message,
    });
  }
}
