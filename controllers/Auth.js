import argon2 from 'argon2';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { z } from 'zod';

// Helper respons
const ok = (res, data, msg = 'OK', code = 200) =>
    res.status(code).json({ ok: true, msg, ...data });
const fail = (res, code, msg, errors) =>
    res.status(code).json({ ok: false, msg, ...(errors ? { errors } : {}) });

const norm = (v) => String(v ?? '').trim();

const ARGON2_OPTS = {
    type: argon2.argon2id,
    timeCost: 3, // naikkan perlahan jika server kuat
    memoryCost: 1 << 15, // 32 MB
    parallelism: 1,
};

let DUMMY_HASH;
async function getDummyHash(argon2, opts) {
    if (!DUMMY_HASH) {
        DUMMY_HASH = await argon2.hash('not-a-real-password', opts);
    }
    return DUMMY_HASH;
}

const LoginSchema = z.object({
    username: z.string().min(1, 'Username wajib diisi'),
    password: z.string().min(1, 'Password wajib diisi'),
});

// POST /auth/login
export const login = async (req, res) => {
    try {
        // Validasi input awal
        const parsed = LoginSchema.safeParse(req.body);
        if (!parsed.success) {
            return fail(
                res,
                422,
                'Validasi gagal',
                parsed.error.flatten().fieldErrors,
            );
        }
        const { username, password } = parsed.data;

        // Ambil user + role
        const user = await User.findOne({
            where: { username },
            attributes: [
                'id',
                'full_name',
                'username',
                'password_hash',
                'status',
                'role_id',
            ],
            include: { model: Role, attributes: ['id', 'name'] },
        });

        // Pesan umum (untuk keamanan)
        const badCred = () => fail(res, 401, 'Username atau password salah');

        // Jika user tidak ditemukan → kirim error spesifik tapi tetap aman
        if (!user || !user.password_hash) {
            // verifikasi dummy agar waktu respon tetap seragam
            try {
                await argon2.verify(
                    await getDummyHash(argon2, ARGON2_OPTS),
                    password,
                );
            } catch {}

            // kembalikan error yang bisa dibaca frontend
            return fail(res, 401, 'Username tidak terdaftar', {
                username: 'Username tidak terdaftar',
            });
        }

        if (password.length <= 6) {
            return fail(
                res,
                400,
                'Password tidak boleh kurang dari 6 karakter',
                {
                    password: 'Password tidak boleh kurang dari 6 karakter',
                },
            );
        }

        // Verifikasi password
        const isOk = await argon2.verify(user.password_hash, password);
        if (!isOk)
            return fail(res, 401, 'Password salah', {
                password: 'Password salah',
            });

        // Rehash jika parameter berubah (opsional)
        const needsRehash = await argon2.needsRehash?.(
            user.password_hash,
            ARGON2_OPTS,
        );
        if (needsRehash) {
            try {
                const newHash = await argon2.hash(password, ARGON2_OPTS);
                await user.update({ password_hash: newHash });
            } catch {
                // abaikan error rehash
            }
        }

        // Cek status akun
        if (user.status === 'banned') return fail(res, 403, 'Akun diblokir');
        if (user.status !== 'active') return fail(res, 403, 'Akun tidak aktif');

        // Regenerate session untuk keamanan
        await new Promise((resolve, reject) =>
            req.session.regenerate((err) => (err ? reject(err) : resolve())),
        );

        // Simpan data user minimal di session
        req.session.user = {
            id: user.id,
            full_name: user.full_name,
            username: user.username,
            role_id: user.role_id,
            role: user.role?.name ?? null,
            status: user.status,
        };

        return ok(res, { user: req.session.user }, 'Login berhasil');
    } catch (err) {
        return fail(res, 500, err?.message || 'Gagal login');
    }
};

// GET /auth/me
// Selalu 200; kalau belum login -> user:null
export const me = async (req, res) => {
    try {
        if (!req.session?.user) {
            return ok(res, { user: null }, 'OK');
        }
        // Re-hydrate role terbaru agar perubahan role langsung tercermin
        const dbUser = await User.findByPk(req.session.user.id, {
            attributes: ['id', 'full_name', 'username', 'status', 'role_id'],
            include: { model: Role, attributes: ['id', 'name'] },
        });
        if (!dbUser) {
            // session usang — bersihkan
            req.session.user = null;
            return ok(res, { user: null }, 'OK');
        }
        // Update session minimal
        req.session.user = {
            id: dbUser.id,
            full_name: dbUser.full_name,
            username: dbUser.username,
            role_id: dbUser.role_id,
            role: dbUser.role?.name ?? null,
            status: dbUser.status,
        };
        return ok(res, { user: req.session.user }, 'OK');
    } catch (err) {
        return fail(res, 500, err?.message || 'Gagal mengambil sesi');
    }
};

// POST /auth/logout
export const logout = (req, res) => {
    if (!req.session) return ok(res, {}, 'Sudah logout');
    req.session.destroy((err) => {
        if (err) return fail(res, 500, 'Gagal logout');
        // Pastikan nama cookie sesuai setingan express-session kamu
        res.clearCookie('sid', {
            httpOnly: true,
            sameSite: 'lax',
            secure: false,
            path: '/',
        });
        return ok(res, {}, 'Logout berhasil');
    });
};
