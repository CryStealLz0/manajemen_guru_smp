import db, { DataTypes } from '../config/Database.js';

const AcademicYear = db.define(
    'academic_years',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        name: { type: DataTypes.STRING(32), allowNull: false, unique: true },
        start_date: { type: DataTypes.DATEONLY, allowNull: false },
        end_date: { type: DataTypes.DATEONLY, allowNull: false },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: false,
    },
);

export default AcademicYear;
