# 📦 Project Setup Guide

Panduan lengkap untuk menjalankan proyek ini di lingkungan lokal.

---

## 🔧 1. Install Dependencies

Jalankan perintah berikut di terminal untuk meng-install semua package yang
dibutuhkan:

```bash
npm install
```

---

## 🛠️ 2. Konfigurasi Database

- Buka file konfigurasi database: config/database.js

- Sesuaikan pengaturannya dengan environment lokal kamu:
  - `host`
  - `username`
  - `password`
  - `database`

---

## 🧱 3. Aktifkan Bootstrapping Database

- Buka file utama server.js.
- Pastikan **kode untuk bootstrapping database** tidak dikomentari.
- Biasanya berupa pemanggilan fungsi `db.sync()`.

---

## 🗂️ 4. Buat Role Secara Manual

Tambahkan data berikut secara manual ke tabel `Roles` di database kamu:

| ID  | Role    |
| --- | ------- |
| 1   | Admin   |
| 2   | Teacher |

---

## 👤 5. Seed Admin User

# 🌱 Seed Data Documentation

Panduan lengkap untuk menjalankan proses **seeding** data proyek ini.

---

# 🔧 Ringkasan

Semua skrip seeding dijalankan menggunakan **Node.js** melalui perintah
`npm run`.  
Gunakan perintah-perintah di bawah untuk mengisi data awal (akun, master
akademik, relasi, dan jadwal).

---

# 🧑‍💻 Akun & Pengguna

| Command                | Deskripsi                                   |
| ---------------------- | ------------------------------------------- |
| `npm run seed:admin`   | Membuat akun **Admin**                      |
| `npm run seed:teacher` | Membuat data **Guru utama**                 |
| `npm run seed:te`      | Membuat data guru dari contoh (**example**) |

---

# 🎓 Master Akademik

| Command            | Deskripsi                                   |
| ------------------ | ------------------------------------------- |
| `npm run seed:a-y` | Mengisi **Academic Years (Tahun Akademik)** |
| `npm run seed:se`  | Mengisi **Semesters (Semester)**            |
| `npm run seed:su`  | Mengisi **Subjects (Mata Pelajaran)**       |
| `npm run seed:cl`  | Mengisi **Classes (Kelas)**                 |
| `npm run seed:pe`  | Mengisi **Periods (Jam Pelajaran)**         |
| `npm run seed:ro`  | Mengisi **Rooms (Ruang)**                   |

---

# 🔗 Relasi & Jadwal

| Command            | Deskripsi                       |
| ------------------ | ------------------------------- |
| `npm run seed:c-s` | Relasi **Class ↔ Subject**      |
| `npm run seed:t-s` | Relasi **Teacher ↔ Subject**    |
| `npm run seed:ti`  | Mengisi **Timetables (Jadwal)** |

---

# 🧩 Urutan Rekomendasi (Seed dari Nol)

Ikuti urutan ini agar **foreign key** dan relasi antar tabel aman:

1. `npm run seed:admin`
2. `npm run seed:teacher` **atau** `npm run seed:te`
3. `npm run seed:a-y`
4. `npm run seed:se`
5. `npm run seed:su`
6. `npm run seed:cl`
7. `npm run seed:pe`
8. `npm run seed:ro`
9. `npm run seed:c-s`
10. `npm run seed:t-s`
11. `npm run seed:ti`

> **Tips:** Jika kamu sudah menambahkan script `seed:all` di `package.json`,
> cukup jalankan:
>
> ```bash
> npm run seed:all
> ```

---

# 🧪 Contoh Penggunaan

## Seed hanya mapel & relasinya

```bash
npm run seed:su
npm run seed:c-s
npm run seed:t-s
```

## Seed lengkap (semua data)

```bash
npm run seed:admin
npm run seed:teacher
npm run seed:a-y
npm run seed:se
npm run seed:su
npm run seed:cl
npm run seed:pe
npm run seed:ro
npm run seed:c-s
npm run seed:t-s
npm run seed:ti
```

---

# 🛠️ Troubleshooting

| Masalah                                 | Penyebab Umum                     | Solusi                                                                                                            |
| --------------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| ❌ **"Permission denied" (PowerShell)** | Execution Policy memblokir script | Buka PowerShell **as Administrator**, lalu jalankan: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` |
| ⚙️ **Koneksi DB gagal**                 | `.env` salah / DB belum aktif     | Cek host, port, user, password, **nama DB**, dan pastikan service database berjalan                               |
| ⚠️ **Duplicate key error**              | Data pernah di-seed               | Hapus data lama, atau ubah seeder menjadi **upsert/idempotent**                                                   |
| 🔗 **Foreign key constraint fails**     | Urutan seed tidak sesuai          | Ikuti **urutan rekomendasi** pada bagian di atas                                                                  |

---

# 📁 Struktur Folder Seeder

```
seeds/
├── seed-admin.js
├── seed-teacher.js
└── seeds-example/
    ├── seed-teachers.js
    ├── seed-academic-years.js
    ├── seed-subjects.js
    ├── seed-semesters.js
    ├── seed-classes.js
    ├── seed-periods.js
    ├── seed-rooms.js
    ├── seed-class-subjects.js
    ├── seed-teacher-subjects.js
    └── seed-timetables.js
```

---

## 🔍 6. Uji API dengan REST Client

Untuk pengujian endpoint secara langsung dari editor:

1. Install extension **REST Client** di VS Code (jika belum terpasang).
2. Gunakan file berikut sebagai contoh: request.rest
3. Atau bisa gunakan link postman yang telah di berikan

---

## Selesai!

Setelah semua langkah di atas dilakukan, server siap dijalankan dan diuji

---

### 📌 Catatan Tambahan

- Pastikan database sudah dibuat dan server database berjalan.
- Jika menggunakan `.env`, pastikan file tersebut sudah diisi dengan benar.

### .env saat ini masih berupa ini

APP_PORT = example 5000 SESS_SECRET = sring acak seterah wkwkwk

SEED_ADMIN_USERNAME=admin (example) SEED_ADMIN_PASSWORD=admin123 (example)

dan ini masih baru coba fitur login blm buat yang lainnya.
