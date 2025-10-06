// controllers/academicYearController.js
import AcademicYear from '../models/AcademicYear.js';

// Ambil semua academic years
export async function getAcademicYears(req, res) {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit || '10', 10), 1),
            100,
        );
        const offset = (page - 1) * limit;

        const q = (req.query.q ?? '').trim();
        const where = {};
        if (q) {
            // MySQL: LIKE %q%
            where[Op.or] = [
                { name: { [Op.substring]: q } }, // LIKE %q%
            ];
        }

        const { rows, count } = await AcademicYear.findAndCountAll({
            where,
            order: [['id', 'ASC']],
            limit,
            offset,
            distinct: true, // jaga-jaga bila nanti ada include
        });

        return res.status(200).json({
            ok: true,
            msg: 'Academic Years fetched',
            data: rows,
            meta: {
                page,
                limit,
                total: count,
                pages: Math.max(1, Math.ceil(count / limit)),
            },
        });
    } catch (err) {
        return res.status(500).json({
            ok: false,
            msg: 'Gagal mengambil data',
            error: err.message,
        });
    }
}

// Ambil 1 academic year berdasarkan id
export async function getAcademicYearById(req, res) {
    try {
        const { id } = req.params;
        const year = await AcademicYear.findByPk(id);
        if (!year)
            return res
                .status(404)
                .json({ ok: false, msg: 'Academic Year tidak ditemukan' });
        res.json({ ok: true, data: year });
    } catch (err) {
        res.status(500).json({
            ok: false,
            msg: 'Gagal mengambil data',
            error: err.message,
        });
    }
}

// Tambah academic year
export async function createAcademicYear(req, res) {
    try {
        const { name, start_date, end_date } = req.body;
        if (!name || !start_date || !end_date) {
            return res
                .status(400)
                .json({ ok: false, msg: 'Semua field wajib diisi' });
        }

        const year = await AcademicYear.create({ name, start_date, end_date });
        res.status(201).json({
            ok: true,
            msg: 'Academic Year berhasil dibuat',
            data: year,
        });
    } catch (err) {
        res.status(500).json({
            ok: false,
            msg: 'Gagal membuat data',
            error: err.message,
        });
    }
}

// Update academic year
export async function updateAcademicYear(req, res) {
    try {
        const { id } = req.params;
        const { name, start_date, end_date } = req.body;

        const year = await AcademicYear.findByPk(id);
        if (!year)
            return res
                .status(404)
                .json({ ok: false, msg: 'Academic Year tidak ditemukan' });

        await year.update({ name, start_date, end_date });
        res.json({
            ok: true,
            msg: 'Academic Year berhasil diperbarui',
            data: year,
        });
    } catch (err) {
        res.status(500).json({
            ok: false,
            msg: 'Gagal memperbarui data',
            error: err.message,
        });
    }
}

// Hapus academic year
export async function deleteAcademicYear(req, res) {
    try {
        const { id } = req.params;
        const year = await AcademicYear.findByPk(id);
        if (!year)
            return res
                .status(404)
                .json({ ok: false, msg: 'Academic Year tidak ditemukan' });

        await year.destroy();
        res.json({ ok: true, msg: 'Academic Year berhasil dihapus' });
    } catch (err) {
        res.status(500).json({
            ok: false,
            msg: 'Gagal menghapus data',
            error: err.message,
        });
    }
}
