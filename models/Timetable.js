import db, { DataTypes, literal } from '../config/Database.js';
import Class from './Class.js';
import Semester from './Semester.js';
import Period from './Period.js';
import Subject from './Subject.js';
import User from './User.js';
import Room from './Room.js';

const Timetable = db.define(
    'timetables',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        class_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        semester_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        day_of_week: { type: DataTypes.SMALLINT.UNSIGNED, allowNull: false }, // 1..7
        period_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        subject_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        teacher_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: false },
        room_id: { type: DataTypes.INTEGER.UNSIGNED, allowNull: true },
        notes: { type: DataTypes.TEXT, allowNull: true },
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
        indexes: [
            {
                unique: true,
                fields: ['class_id', 'semester_id', 'day_of_week', 'period_id'],
                name: 'uq_tt_class_slot',
            },
            {
                unique: true,
                fields: [
                    'teacher_id',
                    'semester_id',
                    'day_of_week',
                    'period_id',
                ],
                name: 'uq_tt_teacher_slot',
            },
            // MySQL allows multiple NULLs in UNIQUE, so this behaves as desired for nullable room_id
            {
                unique: true,
                fields: ['room_id', 'semester_id', 'day_of_week', 'period_id'],
                name: 'uq_tt_room_slot',
            },
            {
                fields: [
                    'teacher_id',
                    'semester_id',
                    'day_of_week',
                    'period_id',
                ],
            },
            { fields: ['class_id', 'semester_id', 'day_of_week', 'period_id'] },
        ],
    },
);

// Associations
Class.hasMany(Timetable, { foreignKey: 'class_id' });
Timetable.belongsTo(Class, { foreignKey: 'class_id' });

Semester.hasMany(Timetable, { foreignKey: 'semester_id' });
Timetable.belongsTo(Semester, { foreignKey: 'semester_id' });

Period.hasMany(Timetable, { foreignKey: 'period_id' });
Timetable.belongsTo(Period, { foreignKey: 'period_id' });

Subject.hasMany(Timetable, { foreignKey: 'subject_id' });
Timetable.belongsTo(Subject, { foreignKey: 'subject_id' });

User.hasMany(Timetable, { foreignKey: 'teacher_id' });
Timetable.belongsTo(User, { as: 'teacher', foreignKey: 'teacher_id' });

Room.hasMany(Timetable, { foreignKey: 'room_id' });
Timetable.belongsTo(Room, { foreignKey: 'room_id' });

export default Timetable;
