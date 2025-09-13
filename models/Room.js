import db, { DataTypes } from '../config/Database.js';

const Room = db.define(
    'rooms',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(64),
            allowNull: false,
            unique: true,
            validate: { notEmpty: true },
        },
        location: { type: DataTypes.STRING(120), allowNull: true },
        capacity: {
            type: DataTypes.INTEGER,
            allowNull: true,
            validate: { min: 0 },
        },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: false,
    },
);

export default Room;
