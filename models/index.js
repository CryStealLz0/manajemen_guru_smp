// models/index.js
import db from '../config/Database.js';

import Role from './Role.js';
import User from './User.js';
import Subject from './Subject.js';
import Class from './Class.js';
import Room from './Room.js';
import AcademicYear from './AcademicYear.js';
import Semester from './Semester.js';
import Period from './Period.js';
import TeacherSubject from './TeacherSubject.js';
import ClassSubject from './ClassSubject.js';
import Timetable from './Timetable.js';

export {
  db,
  Role,
  User,
  Subject,
  Class,
  Room,
  AcademicYear,
  Semester,
  Period,
  TeacherSubject,
  ClassSubject,
  Timetable,
};
