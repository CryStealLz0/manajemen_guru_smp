// seed-admin.js
import 'dotenv/config.js';
import argon2 from 'argon2';
import { db } from './models/index.js';
import Role from './models/Role.js';
import User from './models/User.js';

(async () => {
    const USERNAME = process.env.SEED_ADMIN_USERNAME || 'admin';
    const PASSWORD = process.env.SEED_ADMIN_PASSWORD || 'admin123';

    const tx = await db.transaction(); // <--- di sini mulai transaksi
    try {
        // Pastikan role admin ada
        const [adminRole] = await Role.findOrCreate({
            where: { name: 'admin' },
            defaults: { name: 'admin' },
            transaction: tx, // selalu tambahkan transaction
        });

        // Cari user admin
        let admin = await User.findOne({
            where: { username: USERNAME },
            transaction: tx,
        });

        if (!admin) {
            const passHash = await argon2.hash(PASSWORD);
            admin = await User.create(
                {
                    username: USERNAME,
                    full_name: 'Administrator',
                    nip: '221011400210',
                    role_id: adminRole.id,
                    phone: '08121234124',
                    status: 'active',
                    password_hash: passHash,
                },
                { transaction: tx },
            );

            console.log(`✔ Admin CREATED → ${USERNAME} / ${PASSWORD}`);
        } else {
            await admin.update(
                {
                    role_id: adminRole.id,
                    status: 'active',
                },
                { transaction: tx },
            );
            console.log(`✔ Admin UPDATED → ${USERNAME}`);
        }

        await tx.commit(); // <--- commit kalau sukses semua
        process.exit(0);
    } catch (err) {
        await tx.rollback(); // <--- rollback kalau error
        console.error('Seed admin failed:', err);
        process.exit(1);
    }
})();
