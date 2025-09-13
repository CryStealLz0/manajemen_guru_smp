import argon2 from 'argon2';
import User from '../models/User.js';
import Role from '../models/Role.js';

// POST /auth/login
export const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // cari user + role
        const user = await User.findOne({
            where: { username },
            include: { model: Role, attributes: ['name'] },
        });
        if (!user)
            return res
                .status(401)
                .json({ msg: 'Username atau password salah' });

        // verifikasi password
        const ok = await argon2.verify(user.password_hash, password || '');
        if (!ok)
            return res
                .status(401)
                .json({ msg: 'Username atau password salah' });

        if (user.status !== 'active') {
            return res.status(403).json({ msg: 'Akun tidak aktif' });
        }

        // simpan data minimal ke session
        req.session.user = {
            id: user.id,
            full_name: user.full_name,
            username: user.username,
            role: user.role?.name || 'teacher', // default fallback
        };

        res.json({ msg: 'Login berhasil', user: req.session.user });
    } catch (err) {
        res.status(500).json({ msg: err.message });
    }
};

// GET /auth/me
export const me = async (req, res) => {
    if (!req.session?.user) {
        return res.status(401).json({ msg: 'Belum login' });
    }
    res.json({ user: req.session.user });
};

// POST /auth/logout
export const logout = (req, res) => {
    if (!req.session) return res.json({ msg: 'Sudah logout' });
    req.session.destroy((err) => {
        if (err) return res.status(500).json({ msg: 'Gagal logout' });
        res.clearCookie('connect.sid'); // opsional
        res.json({ msg: 'Logout berhasil' });
    });
};
