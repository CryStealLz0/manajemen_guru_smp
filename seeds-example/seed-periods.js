// seed-periods.js
import 'dotenv/config.js';
import { db } from '../models/index.js';
import Period from '../models/Period.js';

(async () => {
  const tx = await db.transaction();

  try {
    const data = [
      {
        title: 'Pelajaran 1',
        start_time: '07:00:00',
        end_time: '07:40:00',
      },
      {
        title: 'Pelajaran 2',
        start_time: '07:40:00',
        end_time: '08:20:00',
      },
      {
        title: 'Pelajaran 3',
        start_time: '08:20:00',
        end_time: '09:00:00',
      },
      {
        title: 'Istirahat',
        start_time: '09:00:00',
        end_time: '09:30:00',
      },
      {
        title: 'Pelajaran 4',
        start_time: '09:30:00',
        end_time: '10:10:00',
      },
      {
        title: 'Pelajaran 5',
        start_time: '10:10:00',
        end_time: '10:50:00',
      },
      {
        title: 'Pelajaran 6',
        start_time: '10:50:00',
        end_time: '11:30:00',
      },
    ];

    // Bersihkan data lama (opsional)
    await Period.destroy({ where: {}, transaction: tx });

    // Masukkan data baru
    await Period.bulkCreate(data, {
      transaction: tx,
      fields: ['title', 'start_time', 'end_time'],
    });

    await tx.commit();
    console.log('✅ Seed periods selesai! 7 periode berhasil dimasukkan.');
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed periods gagal:', err.message);
    process.exit(1);
  }
})();
