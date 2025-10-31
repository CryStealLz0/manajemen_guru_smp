// seed-semesters.js
import 'dotenv/config.js';
import { db } from '../../models/index.js';
import AcademicYear from '../../models/AcademicYear.js';
import Semester from '../../models/Semester.js';

(async () => {
  const tx = await db.transaction();

  try {
    // Ambil semua tahun ajaran
    const academicYears = await AcademicYear.findAll({ transaction: tx });

    if (!academicYears.length) {
      console.log(
        '⚠️ Tidak ada data AcademicYear. Harap seed academic_years dulu.',
      );
      await tx.rollback();
      process.exit(1);
    }

    let inserted = 0;
    for (const year of academicYears) {
      const existing = await Semester.findAll({
        where: { academic_year_id: year.id },
        transaction: tx,
      });

      // Jika belum ada semester sama sekali, buat dua semester default
      if (existing.length === 0) {
        const startYear = parseInt(year.name.split('/')[0], 10);

        const data = [
          {
            academic_year_id: year.id,
            name: 'Ganjil',
            start_date: `${startYear}-07-15`, // pertengahan Juli
            end_date: `${startYear}-12-20`, // pertengahan Desember
          },
          {
            academic_year_id: year.id,
            name: 'Genap',
            start_date: `${startYear + 1}-01-05`, // awal Januari
            end_date: `${startYear + 1}-06-20`, // pertengahan Juni
          },
        ];

        await Semester.bulkCreate(data, {
          transaction: tx,
          fields: ['academic_year_id', 'name', 'start_date', 'end_date'],
        });
        inserted += 2;
        console.log(
          `✔ Semester Ganjil & Genap dibuat untuk tahun ajaran ${year.name}`,
        );
      } else {
        console.log(`ℹ Semester untuk ${year.name} sudah ada, dilewati.`);
      }
    }

    await tx.commit();
    console.log(
      `✅ Seed semesters selesai — total semester dibuat: ${inserted}`,
    );
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed semesters gagal:', err.message);
    process.exit(1);
  }
})();
