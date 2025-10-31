// seed-subjects.js
import 'dotenv/config.js';
import argon2 from 'argon2';
import { db } from '../models/index.js';
import Subject from '../models/Subject.js';

(async () => {
  const tx = await db.transaction();

  try {
    // Data dummy mata pelajaran untuk jenjang SMP
    const subjects = [
      {
        code: 'MTK01',
        name: 'Matematika',
        description:
          'Pembelajaran tentang bilangan, aljabar, geometri, dan statistika dasar.',
      },
      {
        code: 'BINDO02',
        name: 'Bahasa Indonesia',
        description:
          'Melatih kemampuan membaca, menulis, berbicara, dan menyimak dalam Bahasa Indonesia.',
      },
      {
        code: 'BING03',
        name: 'Bahasa Inggris',
        description:
          'Pengenalan dasar kosa kata, tata bahasa, dan percakapan sehari-hari dalam Bahasa Inggris.',
      },
      {
        code: 'IPA04',
        name: 'Ilmu Pengetahuan Alam (IPA)',
        description:
          'Mempelajari makhluk hidup, energi, bumi, dan alam semesta.',
      },
      {
        code: 'IPS05',
        name: 'Ilmu Pengetahuan Sosial (IPS)',
        description:
          'Mempelajari lingkungan sosial, sejarah, ekonomi, dan geografi dasar.',
      },
      {
        code: 'PKN06',
        name: 'Pendidikan Pancasila dan Kewarganegaraan (PPKn)',
        description:
          'Nilai-nilai Pancasila dan tanggung jawab sebagai warga negara yang baik.',
      },
      {
        code: 'AGM07',
        name: 'Pendidikan Agama',
        description:
          'Pemahaman ajaran agama sesuai keyakinan dan penerapannya dalam kehidupan.',
      },
      {
        code: 'PJS08',
        name: 'Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)',
        description: 'Aktivitas jasmani, kebugaran, dan pola hidup sehat.',
      },
      {
        code: 'SEN09',
        name: 'Seni Budaya',
        description:
          'Mengembangkan kreativitas melalui seni rupa, musik, tari, dan teater.',
      },
      {
        code: 'TIK10',
        name: 'Informatika (TIK)',
        description:
          'Pengenalan komputer, teknologi digital, dan keterampilan TIK dasar.',
      },
      {
        code: 'PRA11',
        name: 'Prakarya dan Kewirausahaan',
        description:
          'Membuat produk sederhana dan mengenal dasar kewirausahaan.',
      },
    ];

    // Hapus data lama
    await Subject.destroy({ where: {}, transaction: tx });

    // Masukkan data baru
    await Subject.bulkCreate(subjects, {
      transaction: tx,
      fields: ['code', 'name', 'description'], // <- kunci perbaikan
    });

    await tx.commit();
    console.log('✅ Seed subjects berhasil dimasukkan!');
    process.exit(0);
  } catch (err) {
    await tx.rollback();
    console.error('❌ Seed subjects gagal:', err);
    process.exit(1);
  }
})();
