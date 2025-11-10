import db, { DataTypes, literal } from '../config/Database.js';

const Subject = db.define(
    'subjects',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        code: { type: DataTypes.STRING(32), allowNull: true, unique: true },
        name: {
            type: DataTypes.STRING(120),
            allowNull: false,
            unique: true,
            validate: { notEmpty: true },
        },
        description: { type: DataTypes.TEXT, allowNull: true },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    },
);

export default Subject;
