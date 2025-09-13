import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
dotenv.config();

const db = new Sequelize(
    process.env.DB_NAME || 'db_manajemen_guru_smp',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 3306),
        dialect: 'mysql',
    },
);

export default db;
export const DataTypes = Sequelize.DataTypes;
export const Op = Sequelize.Op;
export const literal = Sequelize.literal;
