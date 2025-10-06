import db, { DataTypes } from '../config/Database.js';

const Period = db.define(
    'periods',
    {
        id: {
            type: DataTypes.INTEGER.UNSIGNED,
            autoIncrement: true,
            primaryKey: true,
        },
        title: { type: DataTypes.STRING(32), allowNull: false },
        start_time: { type: DataTypes.TIME, allowNull: false },
        end_time: { type: DataTypes.TIME, allowNull: false },
    },
    {
        freezeTableName: true,
        underscored: true,
        timestamps: false,
    },
);

export default Period;
