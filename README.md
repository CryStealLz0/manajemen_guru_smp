# 📦 Project Setup Guide

Panduan lengkap untuk menjalankan proyek ini di lingkungan lokal.

---

## 🔧 1. Install Dependencies

Jalankan perintah berikut di terminal untuk meng-install semua package yang dibutuhkan: npm install

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

- Buka file utama app.js.
- Pastikan **kode untuk bootstrapping database** tidak dikomentari.
- Biasanya berupa pemanggilan fungsi `db.sync()`.

---

## 🗂️ 4. Buat Role Secara Manual

Tambahkan data berikut secara manual ke tabel `Roles` di database kamu:

| ID | Role    |
|----|---------|
| 1  | Admin   |
| 2  | Teacher |

---

## 👤 5. Seed Admin User

Setelah role tersedia, jalankan perintah berikut di terminal: node seed-admin.js

---

## 🔍 6. Uji API dengan REST Client

Untuk pengujian endpoint secara langsung dari editor:

1. Install extension **REST Client** di VS Code (jika belum terpasang).
2. Gunakan file berikut sebagai contoh:

---

## Selesai!

Setelah semua langkah di atas dilakukan, server siap dijalankan dan diuji

---

### 📌 Catatan Tambahan

- Pastikan database sudah dibuat dan server database berjalan.
- Jika menggunakan `.env`, pastikan file tersebut sudah diisi dengan benar.

### .env saat ini masih berupa ini
APP_PORT = example 5000
SESS_SECRET = sring acak seterah wkwkwk

dan ini masih baru coba fitur login blm buat yang lainnya.