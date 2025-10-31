// seed-teacher.js
import 'dotenv/config.js';
import argon2 from 'argon2';
import { db } from '../models/index.js';
import Role from '../models/Role.js';
import User from '../models/User.js';

(async () => {
  const USERNAME = process.env.SEED_TEACHER_USERNAME || 'teacher';
  const PASSWORD = process.env.SEED_TEACHER_PASSWORD || 'teacher123';

  const tx = await db.transaction();
  try {
    // Pastikan role "teacher" ada
    const [teacherRole] = await Role.findOrCreate({
      where: { name: 'teacher' },
      defaults: { name: 'teacher' },
      transaction: tx,
    });

    // Cari user teacher berdasarkan username
    let teacher = await User.findOne({
      where: { username: USERNAME },
      transaction: tx,
    });

    if (!teacher) {
      const passHash = await argon2.hash(PASSWORD);
      teacher = await User.create(
        {
          username: USERNAME,
          full_name: 'Guru Utama',
          nip: '198801011001',
          role_id: teacherRole.id,
          phone: '08123456789',
          status: 'active',
          password_hash: passHash,
        },
        { transaction: tx },
      );

      console.log(`✔ Teacher CREATED → ${USERNAME} / ${PASSWORD}`);
    } else {
      await teacher.update(
        {
          role_id: teacherRole.id,
          status: 'active',
        },
        { transaction: tx },
      );
      console.log(`✔ Teacher UPDATED → ${USERNAME}`);
    }

    await tx.commit();
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed teacher failed:', err);
    process.exit(1);
  }
})();
