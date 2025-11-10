import db, { DataTypes, literal } from '../config/Database.js';
import Role from './Role.js';

const User = db.define(
    'users',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        full_name: {
            type: DataTypes.STRING(120),
            allowNull: false,
            validate: { notEmpty: true },
        },
        nip: { type: DataTypes.STRING(32), allowNull: true, unique: true },
        phone: { type: DataTypes.STRING(32), allowNull: true, unique: true },
        username: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
            validate: { notEmpty: true },
        },
        password_hash: {
            type: DataTypes.TEXT,
            allowNull: false,
            validate: { notEmpty: true },
        },
        role_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        status: {
            type: DataTypes.STRING(16),
            allowNull: false,
            defaultValue: 'active',
        },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
);

Role.hasMany(User, { foreignKey: 'role_id' });
User.belongsTo(Role, { foreignKey: 'role_id' });

export default User;
