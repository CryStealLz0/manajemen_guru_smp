import User from '../models/User.js';
import Role from '../models/Role.js';
import argon2 from 'argon2';

// GET semua user
export const getUsers = async (req, res) => {
    try {
        const response = await User.findAll({
            attributes: [
                'id',
                'full_name',
                'username',
                'nip',
                'phone',
                'status',
            ],
            include: {
                model: Role,
                attributes: ['name'], // tampilkan nama role
            },
        });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// GET user by ID (param id)
export const getUserById = async (req, res) => {
    try {
        const response = await User.findOne({
            attributes: [
                'id',
                'full_name',
                'username',
                'nip',
                'phone',
                'status',
            ],
            include: { model: Role, attributes: ['name'] },
            where: { id: req.params.id },
        });
        if (!response)
            return res.status(404).json({ msg: 'User tidak ditemukan' });
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ msg: error.message });
    }
};

// CREATE user
export const createUser = async (req, res) => {
    const { full_name, username, phone, nip, password, confPassword, role_id } =
        req.body;

    if (password !== confPassword) {
        return res
            .status(400)
            .json({ msg: 'Password & Konfirmasi tidak cocok' });
    }

    try {
        const hashPassword = await argon2.hash(password);
        await User.create({
            full_name,
            username,
            nip,
            phone,
            password_hash: hashPassword,
            role_id,
            status: 'active',
        });
        res.status(201).json({ msg: 'User berhasil dibuat' });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// UPDATE user
export const updateUser = async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User tidak ditemukan' });

    const {
        full_name,
        username,
        nip,
        phone,
        password,
        confPassword,
        role_id,
        status,
    } = req.body;

    let hashPassword = user.password_hash;
    if (password && password !== '') {
        if (password !== confPassword) {
            return res
                .status(400)
                .json({ msg: 'Password & Konfirmasi tidak cocok' });
        }
        hashPassword = await argon2.hash(password);
    }

    try {
        await user.update({
            full_name,
            username,
            phone,
            nip,
            password_hash: hashPassword,
            role_id,
            status,
        });
        res.status(200).json({ msg: 'User berhasil diperbarui' });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};

// DELETE user
export const deleteUser = async (req, res) => {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User tidak ditemukan' });

    try {
        await user.destroy();
        res.status(200).json({ msg: 'User berhasil dihapus' });
    } catch (error) {
        res.status(400).json({ msg: error.message });
    }
};
