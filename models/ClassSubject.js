import db, { DataTypes } from '../config/Database.js';
import Class from './Class.js';
import Subject from './Subject.js';

const ClassSubject = db.define(
    'class_subjects',
    {
        class_id: {
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
        indexes: [{ unique: true, fields: ['class_id', 'subject_id'] }],
    },
);

Class.belongsToMany(Subject, {
    through: ClassSubject,
    foreignKey: 'class_id',
    otherKey: 'subject_id',
    as: 'subjects',
});
Subject.belongsToMany(Class, {
    through: ClassSubject,
    foreignKey: 'subject_id',
    otherKey: 'class_id',
    as: 'classes',
});

export default ClassSubject;
