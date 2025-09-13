import db, { DataTypes, literal } from '../config/Database.js';
import User from './User.js';

const Class = db.define(
    'classes',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        grade_level: { type: DataTypes.STRING(16), allowNull: false },
        section: { type: DataTypes.STRING(16), allowNull: false },
        name: { type: DataTypes.STRING(64), allowNull: false, unique: true },
        homeroom_teacher_id: {
            type: DataTypes.INTEGER.UNSIGNED,
            allowNull: true,
        },
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

User.hasMany(Class, { foreignKey: 'homeroom_teacher_id' });
Class.belongsTo(User, {
    as: 'homeroom_teacher',
    foreignKey: 'homeroom_teacher_id',
});

export default Class;
