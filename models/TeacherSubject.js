import db, { DataTypes } from '../config/Database.js';
import User from './User.js';
import Subject from './Subject.js';

const TeacherSubject = db.define(
    'teacher_subjects',
    {
        teacher_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
        },
        subject_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: false,
            primaryKey: true,
        },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: false,
        indexes: [{ unique: true, fields: ['teacher_id', 'subject_id'] }],
    },
);

User.belongsToMany(Subject, {
    through: TeacherSubject,
    foreignKey: 'teacher_id',
    otherKey: 'subject_id',
    as: 'subjects',
});
Subject.belongsToMany(User, {
    through: TeacherSubject,
    foreignKey: 'subject_id',
    otherKey: 'teacher_id',
    as: 'teachers',
});

export default TeacherSubject;
