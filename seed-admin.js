// seed-admin.js
import argon2 from 'argon2';
import './models/index.js';
import { db } from './models/index.js';
import Role from './models/Role.js';
import User from './models/User.js';

(async () => {
    await db.authenticate();
    await db.sync();

    const [adminRole] = await Role.findOrCreate({ where: { name: 'admin' } });
    const pass = await argon2.hash('admin123');

    await User.upsert(
        {
            username: 'admin',
            full_name: 'Administrator',
            nip: '221011400210',
            role_id: adminRole.id,
            phone: '08121234124',
            status: 'active',
            password_hash: pass,
        },
        {
            fields: [
                'username',
                'full_name',
                'role_id',
                'status',
                'password_hash',
            ],
        },
    );

    console.log('Admin ready (user: admin / pass: admin123)');
    process.exit(0);
})();
