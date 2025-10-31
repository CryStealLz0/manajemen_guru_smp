// seed-classes.js
import 'dotenv/config.js';
import { db } from '../../models/index.js';
import Class from '../../models/Class.js';
import User from '../../models/User.js';
import Role from '../../models/Role.js';

(async () => {
  const tx = await db.transaction();

  try {
    // Pastikan role teacher ada
    const teacherRole = await Role.findOne({
      where: { name: 'teacher' },
      transaction: tx,
    });

    // Ambil semua guru aktif
    let teachers = [];
    if (teacherRole) {
      teachers = await User.findAll({
        where: { role_id: teacherRole.id, status: 'active' },
        order: [['id', 'ASC']],
        transaction: tx,
      });
    }

    // Daftar kelas yang ingin di-seed
    const classList = [];
    const gradeLevels = ['VII', 'VIII', 'IX'];
    const sections = ['A', 'B', 'C'];

    let teacherIndex = 0;

    for (const grade of gradeLevels) {
      for (const section of sections) {
        const name = `${grade} ${section}`;
        const existing = await Class.findOne({
          where: { name },
          transaction: tx,
        });
        if (existing) {
          console.log(`ℹ Kelas ${name} sudah ada, dilewati.`);
          continue;
        }

        const assignedTeacher =
          teachers.length > 0 ? teachers[teacherIndex % teachers.length] : null;

        classList.push({
          grade_level: grade,
          section,
          name,
          homeroom_teacher_id: assignedTeacher ? assignedTeacher.id : null,
        });

        if (assignedTeacher) teacherIndex++;
      }
    }

    // Insert batch
    if (classList.length > 0) {
      await Class.bulkCreate(classList, {
        transaction: tx,
        fields: ['grade_level', 'section', 'name', 'homeroom_teacher_id'],
      });
      console.log(`✅ ${classList.length} kelas berhasil dibuat.`);
    } else {
      console.log('ℹ Tidak ada kelas baru yang perlu dibuat.');
    }

    await tx.commit();
    console.log('🎉 Seed classes selesai!');
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed classes gagal:', err.message);
    process.exit(1);
  }
})();
