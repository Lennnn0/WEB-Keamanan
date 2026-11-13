# ExamCenter Frontend Application

Aplikasi antarmuka web modern, responsif, dan premium untuk sistem ujian online **ExamCenter**. Dibangun menggunakan React, Vite, TypeScript, Tailwind CSS, dan Lucide Icons.

---

## 🎨 Desain & Tema
- **Palet Warna:** Navy Blue (`#070e17` - `#1e3857`), Royal Blue (`#1d4ed8` - `#2563eb`), Slate, Putih Bersih, dan Aksen Indigo.
- **Tipografi:** Inter font family berstandar UI modern.
- **Komponen Responsif:** Sidebar responsif, top navbar, card statistik, tabel dinamis, modal dialog, toast notification, badge, empty states, dan skeleton/loading states.

---

## 🚀 Fitur Halaman

### Otentikasi & Keamanan:
- **Halaman Login (`/login`):** Deteksi role otomatis, validasi input kredensial, dan pemicu dialog OTP MFA 6 digit ketika Administrator masuk dengan status MFA aktif.
- **Halaman Registrasi Siswa (`/register`):** Formulir pendaftaran siswa dengan validasi kekuatan kata sandi.
- **Modal OTP MFA:** Desain input digit auto-advance, indikator masa berlaku mundur (5 menit), tombol kirim ulang berkala, dan verifikasi instan.

### Portal Administrator (`/admin`):
- **Admin Dashboard (`/admin`):** Metrik utama (total siswa, ujian, bank soal, tingkat kelulusan), kartu aksi cepat, dan log audit keamanan.
- **Bank Soal (`/admin/questions`):** Pencarian, filter mata pelajaran & kesulitan, pembuatan soal manual dengan kunci dan pembahasan, edit, serta hapus.
- **Impor Soal Masal (`/admin/import`):** Upload CSV dan XLSX, unduh template resmi, validasi format baris per baris dengan Zod, pratinjau tabel, deteksi baris bermasalah beserta nomor baris, dan komit transaksi ke basis data.
- **Kelola Ujian (`/admin/exams`):** Buat paket ujian, tentukan durasi & passing score, pilih butir pertanyaan dari bank soal, dan toggle publikasi (*publish/unpublish*).
- **Materi Belajar (`/admin/materials`):** Unggah modul ajar dan dokumen referensi PDF.
- **Data Siswa (`/admin/students`):** Direktori siswa terdaftar beserta riwayat evaluasi pengerjaan.
- **Jadwal Ujian (`/admin/schedules`):** Pengaturan kalender waktu mulai dan berakhirnya sesi ujian.
- **Analisis & Nilai (`/admin/analytics`):** Visualisasi tingkat kelulusan dan rata-rata skor per paket ujian.
- **Pengaturan & MFA (`/admin/settings`):** Pusat keamanan admin untuk mengaktifkan atau menonaktifkan proteksi OTP Email.

### Portal Siswa (`/student`):
- **Student Dashboard (`/student`):** Ringkasan ujian aktif, capaian kelulusan, dan rekomendasi bahan ajar.
- **Ujian Tersedia (`/student/exams`):** Daftar paket ujian resmi siap dikerjakan.
- **Lembar Pengerjaan Ujian (`/student/exams/:id/take`):**
  - Tampilan fokus tanpa distraksi.
  - Timer hitung mundur otomatis dengan proteksi *auto-submit* saat waktu habis.
  - Matriks navigasi nomor soal (dijawab, ragu-ragu, belum dijawab).
  - Penyimpanan jawaban otomatis (*autosave*).
  - Modal konfirmasi penyerahan ujian dengan ringkasan jumlah soal yang belum terjawab.
- **Hasil & Pembahasan Ujian (`/student/results/:attemptId`):**
  - Skor total, persentase, status lulus/remedial, dan animasi confetti kelulusan.
  - Tinjauan butir soal lengkap dengan pilihan siswa, kunci jawaban server, dan pembahasan.
- **Riwayat Ujian (`/student/history`):** Arsip seluruh lembar hasil ujian masa lalu.
- **Pusat Materi Siswa (`/student/materials`):** Unduh dan baca modul belajar.

---

## ⚙️ Panduan Menjalankan Frontend

### 1. Salin File Environment
```bash
cp .env.example .env
```
Isi konfigurasi API backend:
```env
VITE_API_URL=http://localhost:5000/api
```

### 2. Menjalankan Server Pengembangan
```bash
npm run dev
```
Aplikasi akan aktif di `http://localhost:5173`.

### 3. Build Produksi
```bash
npm run build
```
Hasil berkas teroptimasi akan dihasilkan di folder `dist/`.

