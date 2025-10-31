// seed-rooms.js
import 'dotenv/config.js';
import { db } from '../models/index.js';
import Room from '../models/Room.js';

(async () => {
  const tx = await db.transaction();

  try {
    const data = [
      { name: 'Ruang Kelas VII A', location: 'Lantai 1', capacity: 32 },
      { name: 'Ruang Kelas VII B', location: 'Lantai 1', capacity: 32 },
      { name: 'Ruang Kelas VII C', location: 'Lantai 1', capacity: 32 },
      { name: 'Ruang Kelas VIII A', location: 'Lantai 2', capacity: 32 },
      { name: 'Ruang Kelas VIII B', location: 'Lantai 2', capacity: 32 },
      { name: 'Ruang Kelas VIII C', location: 'Lantai 2', capacity: 32 },
      { name: 'Ruang Kelas IX A', location: 'Lantai 3', capacity: 32 },
      { name: 'Ruang Kelas IX B', location: 'Lantai 3', capacity: 32 },
      { name: 'Ruang Kelas IX C', location: 'Lantai 3', capacity: 32 },
      { name: 'Laboratorium Komputer', location: 'Gedung A', capacity: 25 },
      { name: 'Laboratorium IPA', location: 'Gedung B', capacity: 20 },
      { name: 'Perpustakaan', location: 'Gedung Utama', capacity: 40 },
      { name: 'Ruang Guru', location: 'Gedung Utama', capacity: 20 },
      { name: 'UKS', location: 'Gedung C', capacity: 10 },
      { name: 'Aula', location: 'Gedung Serbaguna', capacity: 100 },
    ];

    // Hapus data lama (opsional)
    await Room.destroy({ where: {}, transaction: tx });

    // Masukkan data baru
    await Room.bulkCreate(data, {
      transaction: tx,
      fields: ['name', 'location', 'capacity'],
    });

    await tx.commit();
    console.log(
      '✅ Seed rooms selesai! Total ruangan dimasukkan:',
      data.length,
    );
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed rooms gagal:', err.message);
    process.exit(1);
  }
})();
