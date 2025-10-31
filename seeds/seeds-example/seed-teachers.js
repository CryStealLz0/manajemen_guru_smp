// seeds/seed-example-teacher.js
import 'dotenv/config.js';
import argon2 from 'argon2';
import { db } from '../../models/index.js';
import Role from '../../models/Role.js';
import User from '../../models/User.js';

(async () => {
  const tx = await db.transaction();
  try {
    // Pastikan role teacher tersedia
    const [teacherRole] = await Role.findOrCreate({
      where: { name: 'teacher' },
      defaults: { name: 'teacher' },
      transaction: tx,
    });

    // Data dummy 6 teacher
    const teachers = [
      {
        username: 'teacher01',
        full_name: 'Rina Sari',
        nip: '198801011011',
        phone: '08123456001',
      },
      {
        username: 'teacher02',
        full_name: 'Budi Santoso',
        nip: '198801011002',
        phone: '08123456002',
      },
      {
        username: 'teacher03',
        full_name: 'Siti Rahma',
        nip: '198801011003',
        phone: '08123456003',
      },
      {
        username: 'teacher04',
        full_name: 'Andi Wijaya',
        nip: '198801011004',
        phone: '08123456004',
      },
      {
        username: 'teacher05',
        full_name: 'Dewi Lestari',
        nip: '198801011005',
        phone: '08123456005',
      },
      {
        username: 'teacher06',
        full_name: 'Taufik Hidayat',
        nip: '198801011006',
        phone: '08123456006',
      },
    ];

    const DEFAULT_PASS = process.env.SEED_TEACHER_PASSWORD || 'teacher123';

    for (const t of teachers) {
      const existing = await User.findOne({
        where: { username: t.username },
        transaction: tx,
      });

      if (!existing) {
        const passHash = await argon2.hash(DEFAULT_PASS);
        await User.create(
          {
            ...t,
            password_hash: passHash,
            role_id: teacherRole.id,
            status: 'active',
          },
          { transaction: tx },
        );
        console.log(`✔ CREATED → ${t.username} (${t.full_name})`);
      } else {
        console.log(`ℹ SKIPPED → ${t.username} (already exists)`);
      }
    }

    await tx.commit();
    console.log('✅ Seeding teachers completed successfully.');
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed teachers failed:', err);
    process.exit(1);
  }
})();
