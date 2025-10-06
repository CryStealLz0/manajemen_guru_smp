// helpers/http.js
export const ok = (res, data = null, msg = 'OK', status = 200, extra = {}) =>
    res.status(status).json({ ok: true, msg, data, ...extra });

export const bad = (res, msg = 'Bad Request', status = 400, errors = null) =>
    res.status(status).json({ ok: false, msg, ...(errors ? { errors } : {}) });

export const vErr = (res, errors, msg = 'Validasi gagal') =>
    res.status(422).json({ ok: false, msg, errors });
