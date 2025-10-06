// validators/userValidator.js
import { z } from 'zod';
import User from '../models/User.js';
import Role from '../models/Role.js';
import { Op } from 'sequelize';

// --- util kecil ---
const trimOrNull = (v) => {
    const s = (v ?? '').toString().trim();
    return s.length ? s : null;
};
const isDigits = (s) => /^\d+$/.test(s);
async function isTaken(field, value, excludeId = null) {
    if (!value) return false;
    const where = {
        [field]: value,
        ...(excludeId ? { id: { [Op.ne]: excludeId } } : {}),
    };
    const found = await User.findOne({ where, attributes: ['id'] });
    return !!found;
}

// --- skema dasar (common) ---
const UsernameSchema = z
    .string()
    .min(1, 'Username wajib diisi')
    .regex(
        /^[a-zA-Z0-9._-]{3,32}$/,
        'Username 3–32, huruf/angka/titik/underscore/dash',
    );

const PhoneSchema = z
    .string()
    .regex(/^\+?\d{8,20}$/, 'Nomor HP 8–20 digit (boleh diawali +)');

const NipSchema = z
    .string()
    .refine(
        (v) => isDigits(v) && v.length >= 6 && v.length <= 25,
        'NIP hanya angka 6–25 digit',
    );

const StatusSchema = z.enum(['active', 'inactive', 'banned', 'pending'], {
    errorMap: () => ({ message: 'Status tidak valid' }),
});

// --- CREATE: skema request mentah ---
const CreateRawSchema = z.object({
    full_name: z.string().min(1, 'Nama lengkap wajib diisi'),
    username: UsernameSchema,
    phone: z.string().optional().or(z.literal('')),
    nip: z.string().optional().or(z.literal('')),
    password: z.string().min(6, 'Password minimal 6 karakter'),
    role_id: z.coerce.number({ invalid_type_error: 'Role wajib dipilih' }),
    status: z.string().optional(), // akan dinormalisasi
});

// --- UPDATE: skema request mentah ---
const UpdateRawSchema = z.object({
    full_name: z.string().optional(),
    username: z.string().optional(),
    phone: z.string().optional(),
    nip: z.string().optional(),
    password: z.string().optional(),
    confPassword: z.string().optional(),
    role_id: z.coerce.number().optional(),
    status: z.string().optional(),
});

// --- normalisasi dan validasi bisnis tambahan ---

export async function validateCreatePayload(body) {
    // 1) Validasi bentuk dasar
    const parsed = CreateRawSchema.safeParse(body);
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors, values: null };
    }

    // 2) Normalisasi
    const raw = parsed.data;
    const values = {
        full_name: trimOrNull(raw.full_name),
        username: trimOrNull(raw.username),
        phone: trimOrNull(raw.phone),
        nip: trimOrNull(raw.nip),
        password: raw.password,
        role_id: raw.role_id,
        status: trimOrNull(raw.status) || 'active',
    };

    // 3) Validasi format lanjutan yang kondisional
    const errors = {};

    if (values.phone) {
        const p = PhoneSchema.safeParse(values.phone);
        if (!p.success) errors.phone = p.error.issues[0].message;
    }
    if (values.nip) {
        const n = NipSchema.safeParse(values.nip);
        if (!n.success) errors.nip = n.error.issues[0].message;
    }
    const st = StatusSchema.safeParse(values.status);
    if (!st.success) errors.status = st.error.issues[0].message;

    // 4) Validasi foreign key Role
    if (values.role_id == null || Number.isNaN(values.role_id)) {
        errors.role_id = 'Role wajib dipilih';
    } else {
        const role = await Role.findByPk(values.role_id, {
            attributes: ['id'],
        });
        if (!role) errors.role_id = 'Role tidak ditemukan';
    }

    // 5) Unik
    if (values.username && (await isTaken('username', values.username))) {
        errors.username = 'Username sudah terdaftar';
    }
    if (values.phone && (await isTaken('phone', values.phone))) {
        errors.phone = 'Nomor HP sudah terdaftar';
    }
    if (values.nip && (await isTaken('nip', values.nip))) {
        errors.nip = 'NIP sudah terdaftar';
    }

    return { errors, values };
}

export async function validateUpdatePayload(body, currentUserId) {
    // 1) Validasi dasar
    const parsed = UpdateRawSchema.safeParse(body);
    if (!parsed.success) {
        return { errors: parsed.error.flatten().fieldErrors, values: null };
    }
    const raw = parsed.data;

    // 2) Normalisasi
    const values = {
        full_name:
            raw.full_name === undefined ? null : trimOrNull(raw.full_name),
        username: raw.username === undefined ? null : trimOrNull(raw.username),
        phone: raw.phone === undefined ? null : trimOrNull(raw.phone),
        nip: raw.nip === undefined ? null : trimOrNull(raw.nip),
        role_id: raw.role_id ?? null,
        status: raw.status === undefined ? null : trimOrNull(raw.status),
        password: raw.password ?? '',
        confPassword: raw.confPassword ?? '',
    };

    // 3) Validasi format kondisional
    const errors = {};

    if (values.username) {
        const u = UsernameSchema.safeParse(values.username);
        if (!u.success) errors.username = u.error.issues[0].message;
    }
    if (values.password) {
        if (String(values.password).length < 6) {
            errors.password = 'Password minimal 6 karakter';
        }
        if (values.password !== values.confPassword) {
            errors.confPassword = 'Konfirmasi tidak cocok';
        }
    }
    if (values.phone) {
        const p = PhoneSchema.safeParse(values.phone);
        if (!p.success) errors.phone = p.error.issues[0].message;
    }
    if (values.nip) {
        const n = NipSchema.safeParse(values.nip);
        if (!n.success) errors.nip = n.error.issues[0].message;
    }
    if (values.status) {
        const st = StatusSchema.safeParse(values.status);
        if (!st.success) errors.status = st.error.issues[0].message;
    }
    if (values.role_id) {
        const role = await Role.findByPk(values.role_id, {
            attributes: ['id'],
        });
        if (!role) errors.role_id = 'Role tidak ditemukan';
    }

    // 4) Unik (exclude self)
    if (
        values.username &&
        (await isTaken('username', values.username, currentUserId))
    ) {
        errors.username = 'Username sudah terdaftar';
    }
    if (values.phone && (await isTaken('phone', values.phone, currentUserId))) {
        errors.phone = 'Nomor HP sudah terdaftar';
    }
    if (values.nip && (await isTaken('nip', values.nip, currentUserId))) {
        errors.nip = 'NIP sudah terdaftar';
    }

    // Kembalikan tanpa confPassword (tidak diperlukan di controller)
    const { confPassword, ...finalValues } = values;
    return { errors, values: finalValues };
}
