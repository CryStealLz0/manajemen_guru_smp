import sequelize from '../config/Database.js';
import User from '../models/User.js';
import Role from '../models/Role.js';
import argon2 from 'argon2';
import { ok, bad, vErr } from '../helpers/http.js';
import {
    validateCreatePayload,
    validateUpdatePayload,
} from '../validators/userValidator.js';

// GET /users
export const getUsers = async (req, res) => {
    try {
        const page = Math.max(parseInt(req.query.page || '1', 10), 1);
        const limit = Math.min(
            Math.max(parseInt(req.query.limit || '10', 10), 1),
            100,
        );
        const offset = (page - 1) * limit;

        const q = (req.query.q ?? '').trim() || null;
        const status = (req.query.status ?? '').trim() || null;
        const role_id = req.query.role_id ? Number(req.query.role_id) : null;

        const { Op } = await import('sequelize');
        const where = {};
        if (q) {
            // Gunakan operator yang cocok dengan dialect DB-mu:
            // - Postgres: Op.iLike
            // - MySQL/SQLite: Op.substring (LIKE %...%)
            const likeOp = Op.iLike ?? Op.substring;
            where[Op.or] = [
                { full_name: { [likeOp]: `%${q}%` } },
                { username: { [likeOp]: `%${q}%` } },
                { phone: { [likeOp]: `%${q}%` } },
                { nip: { [likeOp]: `%${q}%` } },
            ];
        }
        if (status) where.status = status;
        if (role_id) where.role_id = role_id;

        const { rows, count } = await User.findAndCountAll({
            where,
            attributes: [
                'id',
                'full_name',
                'username',
                'nip',
                'phone',
                'status',
                'role_id',
                'createdAt',
                'updatedAt',
            ],
            include: { model: Role, attributes: ['id', 'name'] },
            order: [['id', 'ASC']],
            limit,
            offset,
        });

        return ok(res, rows, 'Users fetched', 200, {
            meta: {
                page,
                limit,
                total: count,
                pages: Math.ceil(count / limit),
            },
        });
    } catch (error) {
        return bad(res, 'Gagal mengambil data user', 500);
    }
};

// GET /users/:id
export const getUserById = async (req, res) => {
    try {
        const u = await User.findOne({
            attributes: [
                'id',
                'full_name',
                'username',
                'nip',
                'phone',
                'status',
                'role_id',
                'createdAt',
                'updatedAt',
            ],
            include: { model: Role, attributes: ['id', 'name'] },
            where: { id: req.params.id },
        });
        if (!u) return bad(res, 'User tidak ditemukan', 404);
        return ok(res, u, 'User fetched');
    } catch (error) {
        return bad(res, 'Gagal mengambil user', 500);
    }
};

// POST /users
export const createUser = async (req, res) => {
    try {
        const { errors, values } = await validateCreatePayload(req.body);
        if (errors && Object.keys(errors).length) return vErr(res, errors);

        const hashPassword = await argon2.hash(values.password, {
            type: argon2.argon2id,
        });

        const createdSafe = await sequelize.transaction(async (t) => {
            const u = await User.create(
                {
                    full_name: values.full_name,
                    username: values.username,
                    phone: values.phone,
                    nip: values.nip,
                    password_hash: hashPassword,
                    role_id: values.role_id,
                    status: values.status,
                },
                { transaction: t },
            );

            return {
                id: u.id,
                full_name: u.full_name,
                username: u.username,
                phone: u.phone,
                nip: u.nip,
                role_id: u.role_id,
                status: u.status,
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
            };
        });

        return ok(res, createdSafe, 'User berhasil dibuat', 201);
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') {
            // Sequelize-level unique (backup)
            const errs = {};
            for (const e of err?.errors || [])
                errs[e.path] = e.message || 'Tidak valid';
            return bad(res, 'Duplikasi data', 409, errs);
        }
        if (err?.name === 'SequelizeValidationError') {
            const errs = {};
            for (const e of err?.errors || [])
                errs[e.path] = e.message || 'Tidak valid';
            return vErr(res, errs);
        }
        return bad(res, err?.message || 'Gagal membuat user', 400);
    }
};

// PUT /users/:id
export const updateUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return bad(res, 'User tidak ditemukan', 404);

        const { errors, values } = await validateUpdatePayload(
            req.body,
            user.id,
        );
        if (errors && Object.keys(errors).length) return vErr(res, errors);

        let hashPassword = user.password_hash;
        if (values.password) {
            hashPassword = await argon2.hash(values.password, {
                type: argon2.argon2id,
            });
        }

        await user.update({
            ...(values.full_name !== null
                ? { full_name: values.full_name }
                : {}),
            ...(values.username !== null ? { username: values.username } : {}),
            ...(values.phone !== null ? { phone: values.phone } : {}),
            ...(values.nip !== null ? { nip: values.nip } : {}),
            ...(values.role_id ? { role_id: values.role_id } : {}),
            ...(values.status ? { status: values.status } : {}),
            password_hash: hashPassword,
        });

        const safe = {
            id: user.id,
            full_name: user.full_name,
            username: user.username,
            phone: user.phone,
            nip: user.nip,
            role_id: user.role_id,
            status: user.status,
            updatedAt: user.updatedAt,
        };

        return ok(res, safe, 'User berhasil diperbarui', 200);
    } catch (err) {
        if (err?.name === 'SequelizeUniqueConstraintError') {
            const errs = {};
            for (const e of err?.errors || [])
                errs[e.path] = e.message || 'Tidak valid';
            return bad(res, 'Duplikasi data', 409, errs);
        }
        if (err?.name === 'SequelizeValidationError') {
            const errs = {};
            for (const e of err?.errors || [])
                errs[e.path] = e.message || 'Tidak valid';
            return vErr(res, errs);
        }
        return bad(res, err?.message || 'Gagal memperbarui user', 400);
    }
};

// DELETE /users/:id
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) return bad(res, 'User tidak ditemukan', 404);

        await user.destroy();
        return ok(res, { id: req.params.id }, 'User berhasil dihapus', 200);
    } catch (error) {
        return bad(res, error?.message || 'Gagal menghapus user', 400);
    }
};
