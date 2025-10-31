import Room from '../models/Room.js';

/* Helper */
function s(v) {
  return String(v ?? '').trim();
}
function isEmpty(v) {
  return s(v).length === 0;
}

/* GET /rooms */
export async function getRooms(req, res) {
  try {
    const rooms = await Room.findAll({
      order: [['name', 'ASC']],
    });
    return res.json({ ok: true, data: rooms });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil data ruangan',
      error: err.message,
    });
  }
}

/* GET /rooms/:id */
export async function getRoomById(req, res) {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);
    if (!room)
      return res
        .status(404)
        .json({ ok: false, msg: 'Ruangan tidak ditemukan' });
    return res.json({ ok: true, data: room });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal mengambil ruangan',
      error: err.message,
    });
  }
}

/* POST /rooms */
export async function createRoom(req, res) {
  try {
    const name = s(req.body?.name);
    const location = s(req.body?.location);
    const capacity =
      req.body?.capacity != null ? Number(req.body.capacity) : null;

    // Validasi
    if (isEmpty(name))
      return res
        .status(422)
        .json({ ok: false, msg: 'Nama ruangan wajib diisi' });

    if (name.length > 64)
      return res
        .status(422)
        .json({ ok: false, msg: 'Nama ruangan maksimal 64 karakter' });

    if (location && location.length > 120)
      return res
        .status(422)
        .json({ ok: false, msg: 'Lokasi maksimal 120 karakter' });

    if (capacity != null && (isNaN(capacity) || capacity < 0))
      return res.status(422).json({
        ok: false,
        msg: 'Kapasitas harus berupa angka dan minimal 0',
      });

    const room = await Room.create({ name, location, capacity });
    return res.status(201).json({
      ok: true,
      msg: 'Ruangan berhasil dibuat',
      data: room,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(409)
        .json({ ok: false, msg: 'Nama ruangan sudah digunakan' });
    }
    return res.status(500).json({
      ok: false,
      msg: 'Gagal membuat ruangan',
      error: err.message,
    });
  }
}

/* PUT /rooms/:id */
export async function updateRoom(req, res) {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);
    if (!room)
      return res
        .status(404)
        .json({ ok: false, msg: 'Ruangan tidak ditemukan' });

    const name = 'name' in req.body ? s(req.body.name) : room.name;
    const location =
      'location' in req.body ? s(req.body.location) : room.location;
    const capacity =
      'capacity' in req.body && req.body.capacity != null
        ? Number(req.body.capacity)
        : room.capacity;

    // Validasi
    if (isEmpty(name))
      return res
        .status(422)
        .json({ ok: false, msg: 'Nama ruangan wajib diisi' });

    if (name.length > 64)
      return res
        .status(422)
        .json({ ok: false, msg: 'Nama ruangan maksimal 64 karakter' });

    if (location && location.length > 120)
      return res
        .status(422)
        .json({ ok: false, msg: 'Lokasi maksimal 120 karakter' });

    if (capacity != null && (isNaN(capacity) || capacity < 0))
      return res.status(422).json({
        ok: false,
        msg: 'Kapasitas harus berupa angka dan minimal 0',
      });

    room.name = name;
    room.location = location || null;
    room.capacity = capacity != null ? capacity : null;

    await room.save();

    return res.json({
      ok: true,
      msg: 'Ruangan berhasil diperbarui',
      data: room,
    });
  } catch (err) {
    if (err?.name === 'SequelizeUniqueConstraintError') {
      return res
        .status(409)
        .json({ ok: false, msg: 'Nama ruangan sudah digunakan' });
    }
    return res.status(500).json({
      ok: false,
      msg: 'Gagal memperbarui ruangan',
      error: err.message,
    });
  }
}

/* DELETE /rooms/:id */
export async function deleteRoom(req, res) {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);
    if (!room)
      return res
        .status(404)
        .json({ ok: false, msg: 'Ruangan tidak ditemukan' });

    await room.destroy();
    return res.json({ ok: true, msg: 'Ruangan berhasil dihapus' });
  } catch (err) {
    return res.status(500).json({
      ok: false,
      msg: 'Gagal menghapus ruangan',
      error: err.message,
    });
  }
}
