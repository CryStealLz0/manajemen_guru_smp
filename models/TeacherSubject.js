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

// Many-to-many (tetap)
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

// ⛳️ INI YANG KURANG — relasi balik dari pivot ke parent
TeacherSubject.belongsTo(User, { as: 'teacher', foreignKey: 'teacher_id' });
TeacherSubject.belongsTo(Subject, { as: 'subject', foreignKey: 'subject_id' });

export default TeacherSubject;
