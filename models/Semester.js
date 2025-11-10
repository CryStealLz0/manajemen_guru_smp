import db, { DataTypes, literal } from '../config/Database.js';
import AcademicYear from './AcademicYear.js';

const Semester = db.define(
    'semesters',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        academic_year_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
        },
        name: { type: DataTypes.STRING(32), allowNull: false }, // 'Ganjil' / 'Genap'
        start_date: { type: DataTypes.DATEONLY, allowNull: false },
        end_date: { type: DataTypes.DATEONLY, allowNull: false },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
        indexes: [{ unique: true, fields: ['academic_year_id', 'name'] }],
    },
);

AcademicYear.hasMany(Semester, { foreignKey: 'academic_year_id' });
Semester.belongsTo(AcademicYear, { foreignKey: 'academic_year_id' });

export default Semester;
