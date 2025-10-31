// seed-teacher-subjects.js
import 'dotenv/config.js';
import { db } from '../../models/index.js';
import TeacherSubject from '../../models/TeacherSubject.js';
import User from '../../models/User.js';
import Role from '../../models/Role.js';
import Subject from '../../models/Subject.js';

(async () => {
  const tx = await db.transaction();

  try {
    // Ambil role teacher
    const teacherRole = await Role.findOne({
      where: { name: 'teacher' },
      transaction: tx,
    });

    if (!teacherRole) {
      console.log(
        '⚠️ Role "teacher" belum ada. Jalankan seed-teacher.js dulu.',
      );
      await tx.rollback();
      process.exit(1);
    }

    // Ambil semua guru aktif
    const teachers = await User.findAll({
      where: { role_id: teacherRole.id, status: 'active' },
      order: [['id', 'ASC']],
      transaction: tx,
    });

    // Ambil semua subject
    const subjects = await Subject.findAll({ transaction: tx });

    if (!teachers.length || !subjects.length) {
      console.log('⚠️ Data guru atau subject belum tersedia.');
      await tx.rollback();
      process.exit(1);
    }

    // Pemetaan otomatis guru ↔ subject berdasarkan urutan
    const insertData = [];
    let subjIndex = 0;

    for (const teacher of teachers) {
      // Setiap guru akan dapat 2 pelajaran (jika cukup)
      const assigned = [];

      for (let i = 0; i < 2; i++) {
        const subject = subjects[subjIndex % subjects.length];
        assigned.push(subject);
        subjIndex++;
      }

      for (const subj of assigned) {
        insertData.push({
          teacher_id: teacher.id,
          subject_id: subj.id,
        });
      }
    }

    // Hapus data lama (opsional)
    await TeacherSubject.destroy({ where: {}, transaction: tx });

    // Masukkan data baru
    await TeacherSubject.bulkCreate(insertData, {
      transaction: tx,
      fields: ['teacher_id', 'subject_id'],
      ignoreDuplicates: true,
    });

    await tx.commit();
    console.log(
      `✅ Seed teacher-subjects selesai! Total relasi: ${insertData.length}`,
    );
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed teacher-subjects gagal:', err.message);
    process.exit(1);
  }
})();
