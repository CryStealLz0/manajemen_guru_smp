// seed-class-subjects.js
import 'dotenv/config.js';
import { db } from '../../models/index.js';
import Class from '../../models/Class.js';
import Subject from '../../models/Subject.js';
import ClassSubject from '../../models/ClassSubject.js';

(async () => {
  const tx = await db.transaction();

  try {
    // Ambil semua data kelas & mapel
    const classes = await Class.findAll({ transaction: tx });
    const subjects = await Subject.findAll({ transaction: tx });

    if (!classes.length || !subjects.length) {
      console.log(
        '⚠️ Data Class atau Subject belum tersedia. Seed keduanya dulu.',
      );
      await tx.rollback();
      process.exit(1);
    }

    // Pemetaan default pelajaran untuk tiap tingkat
    const defaultSubjects = {
      VII: [
        'Matematika',
        'Bahasa Indonesia',
        'Bahasa Inggris',
        'IPA',
        'IPS',
        'PPKn',
        'Agama',
        'PJOK',
        'Seni Budaya',
        'TIK',
        'Prakarya dan Kewirausahaan',
      ],
      VIII: [
        'Matematika',
        'Bahasa Indonesia',
        'Bahasa Inggris',
        'IPA',
        'IPS',
        'PPKn',
        'Agama',
        'PJOK',
        'Seni Budaya',
        'TIK',
        'Prakarya dan Kewirausahaan',
      ],
      IX: [
        'Matematika',
        'Bahasa Indonesia',
        'Bahasa Inggris',
        'IPA',
        'IPS',
        'PPKn',
        'Agama',
        'PJOK',
        'Seni Budaya',
        'TIK',
        'Prakarya dan Kewirausahaan',
      ],
    };

    // Data baru yang akan dimasukkan
    const insertData = [];

    for (const cls of classes) {
      const grade = cls.grade_level?.toUpperCase();
      const targetSubjects = defaultSubjects[grade] || [];

      for (const subjName of targetSubjects) {
        const subject = subjects.find(
          (s) => s.name.toLowerCase() === subjName.toLowerCase(),
        );
        if (!subject) continue; // skip kalau belum ada mapelnya
        insertData.push({
          class_id: cls.id,
          subject_id: subject.id,
        });
      }
    }

    // Hapus semua data lama
    await ClassSubject.destroy({ where: {}, transaction: tx });

    // Insert baru
    if (insertData.length > 0) {
      await ClassSubject.bulkCreate(insertData, {
        transaction: tx,
        fields: ['class_id', 'subject_id'],
        ignoreDuplicates: true,
      });
      console.log(
        `✅ ${insertData.length} relasi Class–Subject berhasil dimasukkan.`,
      );
    } else {
      console.log('ℹ Tidak ada data baru yang perlu dimasukkan.');
    }

    await tx.commit();
    console.log('🎉 Seed class-subjects selesai!');
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed class-subjects gagal:', err.message);
    process.exit(1);
  }
})();
