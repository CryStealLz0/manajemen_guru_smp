// Wajib login
export function requireAuth(req, res, next) {
    if (!req.session?.user) {
        return res.status(401).json({ msg: 'Unauthorized: silakan login' });
    }
    next();
}

// Batasi role (contoh: admin saja, atau guru saja)
export function requireRole(...roles) {
    return (req, res, next) => {
        const r = req.session?.user?.role;
        if (!r || !roles.includes(r)) {
            return res.status(403).json({ msg: 'Forbidden: akses ditolak' });
        }
        next();
    };
}

// (Opsional) inject user ke req.user untuk kemudahan handler
export function attachUser(req, _res, next) {
    req.user = req.session?.user || null;
    next();
}
