import db, { DataTypes } from '../config/Database.js';

const Role = db.define(
    'roles',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(32),
            allowNull: false,
            unique: true,
            validate: { notEmpty: true },
        },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: false,
    },
);

export default Role;
