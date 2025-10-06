// controllers/roleController.js
import Role from '../models/Role.js';

// Helper: normalisasi & validasi nama
function sanitizeName(name) {
    return String(name ?? '').trim();
}

export async function getRoles(req, res) {
    try {
        const roles = await Role.findAll({ order: [['id', 'ASC']] });
        return res.json({ ok: true, data: roles });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            msg: 'Gagal mengambil data role',
            error: err.message,
        });
    }
}

export async function getRoleById(req, res) {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        if (!role)
            return res
                .status(404)
                .json({ ok: false, msg: 'Role tidak ditemukan' });
        return res.json({ ok: true, data: role });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            msg: 'Gagal mengambil role',
            error: err.message,
        });
    }
}

export async function createRole(req, res) {
    try {
        const name = sanitizeName(req.body?.name);
        if (!name)
            return res
                .status(422)
                .json({ ok: false, msg: 'Nama role wajib diisi' });
        if (name.length > 32)
            return res.status(422).json({
                ok: false,
                msg: 'Nama role maksimal 32 karakter',
            });

        const role = await Role.create({ name });
        return res
            .status(201)
            .json({ ok: true, msg: 'Role berhasil dibuat', data: role });
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') {
            return res
                .status(409)
                .json({ ok: false, msg: 'Nama role sudah digunakan' });
        }
        return res.status(500).json({
            ok: false,
            msg: 'Gagal membuat role',
            error: err.message,
        });
    }
}

export async function updateRole(req, res) {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        if (!role)
            return res
                .status(404)
                .json({ ok: false, msg: 'Role tidak ditemukan' });

        const name = sanitizeName(req.body?.name);
        if (!name)
            return res
                .status(422)
                .json({ ok: false, msg: 'Nama role wajib diisi' });
        if (name.length > 32)
            return res.status(422).json({
                ok: false,
                msg: 'Nama role maksimal 32 karakter',
            });

        role.name = name;
        await role.save();

        return res.json({
            ok: true,
            msg: 'Role berhasil diperbarui',
            data: role,
        });
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') {
            return res
                .status(409)
                .json({ ok: false, msg: 'Nama role sudah digunakan' });
        }
        return res.status(500).json({
            ok: false,
            msg: 'Gagal memperbarui role',
            error: err.message,
        });
    }
}

export async function deleteRole(req, res) {
    try {
        const { id } = req.params;
        const role = await Role.findByPk(id);
        if (!role)
            return res
                .status(404)
                .json({ ok: false, msg: 'Role tidak ditemukan' });

        await role.destroy();
        return res.json({ ok: true, msg: 'Role berhasil dihapus' });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            msg: 'Gagal menghapus role',
            error: err.message,
        });
    }
}
