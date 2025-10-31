// seed-example-academic-years.js
import 'dotenv/config.js';
import { db } from '../../models/index.js';
import AcademicYear from '../../models/AcademicYear.js';

(async () => {
  const tx = await db.transaction();
  try {
    const data = [
      {
        name: '2021/2022',
        start_date: '2021-07-01',
        end_date: '2022-06-30',
      },
      {
        name: '2022/2023',
        start_date: '2022-07-01',
        end_date: '2023-06-30',
      },
      {
        name: '2023/2024',
        start_date: '2023-07-01',
        end_date: '2024-06-30',
      },
      {
        name: '2024/2025',
        start_date: '2024-07-01',
        end_date: '2025-06-30',
      },
    ];

    for (const item of data) {
      const [record, created] = await AcademicYear.findOrCreate({
        where: { name: item.name },
        defaults: item,
        transaction: tx,
      });

      if (created) {
        console.log(`✔ Academic Year CREATED → ${item.name}`);
      } else {
        console.log(`ℹ Academic Year EXISTS → ${item.name}`);
      }
    }

    await tx.commit();
    console.log('✅ Seeding academic years completed successfully.');
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed academic years failed:', err);
    process.exit(1);
  }
})();
