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
        created_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: literal('CURRENT_TIMESTAMP'),
        },
        updated_at: {
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: literal(
                'CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
            ),
        },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: false,
    },
);

export default Subject;
