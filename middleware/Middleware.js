// middleware/auth.js
import User from '../models/User.js';
import Role from '../models/Role.js';

// ===== Util respons singkat =====
const unauthorized = (res, msg = 'Unauthorized') =>
    res.status(401).json({ ok: false, msg });

const forbidden = (res, msg = 'Forbidden') =>
    res.status(403).json({ ok: false, msg });

// ===== Role hierarchy =====
// Semakin besar angkanya semakin tinggi hak akses
const ROLE_WEIGHT = {
    teacher: 1,
    coordinator: 2,
    admin: 3,
};
// Jika kamu hanya punya 'admin' & 'teacher', boleh ubah:
// const ROLE_WEIGHT = { teacher: 1, admin: 2 };

const normRoles = (roles) =>
    (Array.isArray(roles) ? roles : [roles]).filter(Boolean);

const hasAllowedRole = (currentRole, allowed, useHierarchy = true) => {
    if (!currentRole) return false;
    const allowedArr = normRoles(allowed);
    if (allowedArr.length === 0) return true; // tidak membatasi
    if (!useHierarchy) {
        return allowedArr.includes(currentRole);
    }
    const cur = ROLE_WEIGHT[currentRole] ?? 0;
    // lolos kalau >= salah satu role minimum yang diizinkan
    return allowedArr.some((r) => cur >= (ROLE_WEIGHT[r] ?? 0));
};

// ===== Middleware =====

// Wajib login
export function requireAuth(req, res, next) {
    if (!req.session?.user?.id) {
        return unauthorized(res, 'Unauthorized: silakan login');
    }
    next();
}

// Batasi role (mendukung hierarchical check)
export function requireRole(roles, opts = { hierarchical: true }) {
    return (req, res, next) => {
        const current = req.session?.user?.role;
        if (!hasAllowedRole(current, roles, opts.hierarchical)) {
            return forbidden(res, 'Forbidden: akses ditolak');
        }
        next();
    };
}

// Akses diri sendiri ATAU role tertentu
// Contoh: router.put('/users/:id', requireSelfOrRole('id', ['admin']))
export function requireSelfOrRole(
    paramKey = 'id',
    roles = [],
    opts = { hierarchical: true },
) {
    return (req, res, next) => {
        const sess = req.session?.user;
        if (!sess?.id) return unauthorized(res, 'Unauthorized: silakan login');

        const targetId = String(req.params?.[paramKey] ?? '');
        const isSelf = String(sess.id) === targetId;

        if (isSelf) return next();

        const current = sess.role;
        if (!hasAllowedRole(current, roles, opts.hierarchical)) {
            return forbidden(
                res,
                'Forbidden: bukan pemilik dan role tidak mencukupi',
            );
        }
        next();
    };
}

// (Opsional) Pastikan akun aktif setiap request terproteksi
export async function ensureActiveUser(req, res, next) {
    try {
        const sess = req.session?.user;
        if (!sess?.id) return unauthorized(res, 'Unauthorized: silakan login');

        // Bisa di-cache (mis. setiap N menit), ini versi langsung ke DB
        const dbUser = await User.findByPk(sess.id, {
            attributes: ['id', 'status', 'role_id'],
            include: { model: Role, attributes: ['name'] },
        });

        if (!dbUser) {
            req.session.user = null;
            return unauthorized(res, 'Session invalid: silakan login ulang');
        }
        if (dbUser.status !== 'active') {
            return forbidden(res, 'Akun tidak aktif');
        }

        // sinkronkan role terbaru
        req.session.user.role = dbUser.role?.name ?? req.session.user.role;
        next();
    } catch (e) {
        return res
            .status(500)
            .json({ ok: false, msg: 'Gagal memverifikasi status user' });
    }
}

// Inject user ke req.user (dibekukan agar tidak diubah handler)
export function attachUser(req, _res, next) {
    const u = req.session?.user || null;
    if (u) Object.freeze(u);
    req.user = u;
    next();
}
