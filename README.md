# ExamCenter - Secure Academic Examination Platform

ExamCenter adalah aplikasi web ujian online terintegrasi dengan standar keamanan tinggi yang dibangun di dalam workspace aktif dengan dua folder utama:
- `Backend-WebKeamanan`: Node.js, Express, TypeScript, Supabase PostgreSQL & Auth, **Resend Email API**, Zod, Multer, XLSX/CSV parser.
- `Frontend-WebKeamanan`: React, Vite, TypeScript, Tailwind CSS, Lucide Icons.

---

## 🏗 Struktur Proyek
```
WEB-Keamanan/
├── Backend-WebKeamanan/
│   ├── src/
│   │   ├── config/          # Supabase Client, Resend Client, & Zod Env
│   │   ├── controllers/     # Auth, Questions, Import, Exams, Materials, etc.
│   │   ├── middlewares/     # Auth, RequireAdmin, RequireStudent, RateLimiter
│   │   ├── routes/          # Express REST API Routes
│   │   ├── services/        # OTP Generator, Resend Email Service, Import Parser
│   │   ├── tests/           # Security, Parser, & Anti-Cheat Test Suite
│   │   ├── types/           # Zod Schemas & TypeScript Types
│   │   ├── utils/           # SHA-256 Hashing, OTP Generator, Timing-safe check
│   │   └── index.ts         # Express Server Entrypoint
│   ├── supabase/
│   │   └── migrations/      # 01_schema.sql, 02_rls_policies.sql, 03_seed_data.sql
│   ├── sample_imports/      # sample_valid_soal.csv & sample_invalid_soal.csv
│   ├── .env.example
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── Frontend-WebKeamanan/
│   ├── src/
│   │   ├── api/             # Axios client dengan JWT interceptor
│   │   ├── components/      # Common UI, Badges, Modals, Toast, OtpModal, Layouts
│   │   ├── context/         # AuthContext (Login, Register, MFA OTP state)
│   │   ├── pages/
│   │   │   ├── auth/        # LoginPage & RegisterPage
│   │   │   ├── admin/       # Dashboard, Bank Soal, Impor Soal, Kelola Ujian,
│   │   │   │                # Materi Belajar, Data Siswa, Jadwal, Analisis, Settings (MFA)
│   │   │   └── student/     # Dashboard, Ujian Tersedia, ExamTaking (Timer & Autosave),
│   │   │                    # ExamResult (Review & Pembahasan), Riwayat, Materi
│   │   ├── App.tsx          # React Router & Role-Based Protected Routes
│   │   ├── main.tsx
│   │   └── index.css
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── README.md
│
└── README.md                # Dokumentasi Utama Proyek
```

---

## 🔐 Ringkasan Implementasi Keamanan & Fitur

1. **Autentikasi Supabase & Role-Based Access Control (RBAC):**
   - Mendukung role `admin` dan `student`.
   - Proteksi ganda di database melalui PostgreSQL Row-Level Security (RLS) dan middleware Express.
   - Service Role key Supabase hanya digunakan di backend untuk operasi terproteksi.
2. **Multi-Factor Authentication (MFA) OTP Email Administrator via Resend API:**
   - Admin dapat mengaktifkan/menonaktifkan MFA secara mandiri dari halaman **Settings**.
   - Ketika aktif: setelah password diverifikasi, admin wajib memasukkan OTP 6 digit yang dikirim ke email via **Resend Email API**.
   - OTP berlaku 5 menit, di-hash dengan SHA-256 dan salt unik (tidak pernah disimpan dalam plaintext), batas maksimal 5 kali percobaan, dan sekali pakai (*single-use burn*).
   - Akses admin diblokir sepenuhnya sebelum OTP berhasil diverifikasi.
3. **Integritas Ujian & Isolasi Kunci Jawaban (Zero Client Leak):**
   - Kunci jawaban (`correct_answer`) dan pembahasan (`explanation`) dihapus secara ketat oleh backend sebelum dikirim ke browser siswa saat ujian berlangsung.
   - Penilaian dihitung secara otomatis dan aman di backend saat tombol submit ditekan.
   - Pengerjaan langsung dikunci berstatus `submitted` untuk mencegah submit ganda.
4. **Parser & Validasi Impor Soal (CSV & XLSX):**
   - Mendukung upload file CSV dan Excel (.xlsx).
   - Validasi ketat baris demi baris menggunakan Zod.
   - Fitur pratinjau sebelum impor dengan pelaporan nomor baris spesifik untuk data rusak/invalid.
   - Transaksi database batch yang menjamin tidak ada data setengah tersimpan.
5. **Panel Siswa & Pelaksanaan Ujian Modern:**
   - Navigasi nomor soal (dijawab: biru, ragu-ragu: kuning, belum: abu-abu).
   - Autosave jawaban instan ke server.
   - Timer hitung mundur dengan peringatan warna merah saat waktu tersisa < 5 menit dan auto-submit saat habis.
   - Modal konfirmasi penyerahan dengan deteksi jumlah soal yang belum terjawab.
   - Halaman hasil evaluasi dengan perolehan skor, status kelulusan, animasi confetti, dan ulasan pembahasan soal.

---

## 📋 Daftar Variabel Lingkungan (.env) yang Dibutuhkan

Silakan buat file `.env` di masing-masing folder dengan menyalin dari `.env.example`:

### 1. `Backend-WebKeamanan/.env`
| Variabel | Keterangan | Contoh / Panduan |
| :--- | :--- | :--- |
| `PORT` | Port server Express | `5000` |
| `NODE_ENV` | Environment mode | `development` |
| `CLIENT_URL` | URL frontend React | `http://localhost:5173` |
| `SUPABASE_URL` | URL project Supabase Anda | Dapatkan dari: Supabase Dashboard -> Project Settings -> API (`https://xyzcompany.supabase.co`) |
| `SUPABASE_ANON_KEY` | Public Anon Key Supabase | Dapatkan dari: Supabase Dashboard -> Project Settings -> API |
| `SUPABASE_SERVICE_ROLE_KEY` | Secret Service Role Key Supabase | Dapatkan dari: Supabase Dashboard -> Project Settings -> API (*Rahasiakan*) |
| `JWT_MFA_SECRET` | Kunci enkripsi token sesi MFA | String acak minimal 32 karakter |
| `RESEND_API_KEY` | Kunci API Resend untuk pengiriman OTP | Dapatkan dari: https://resend.com/api-keys (`re_...`) |
| `RESEND_FROM_EMAIL` | Alamat pengirim email terverifikasi | `ExamCenter Security <onboarding@resend.dev>` atau domain Anda |

### 2. `Frontend-WebKeamanan/.env`
| Variabel | Keterangan | Nilai |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base URL API Backend | `http://localhost:5000/api` |

---

## 🚀 Panduan Menjalankan Sistem

### Langkah 1: Eksekusi SQL Migrations di Supabase
Buka **SQL Editor** pada project Supabase Anda, lalu salin dan jalankan skrip berikut berurutan:
1. `Backend-WebKeamanan/supabase/migrations/01_schema.sql` (Tabel, relasi, triggers)
2. `Backend-WebKeamanan/supabase/migrations/02_rls_policies.sql` (Kebijakan keamanan RLS)
3. `Backend-WebKeamanan/supabase/migrations/03_seed_data.sql` (Mata pelajaran dan sampel soal awal)

### Langkah 2: Jalankan Backend
```bash
cd Backend-WebKeamanan
npm run dev
```
Backend akan aktif di `http://localhost:5000`.

Untuk menjalankan rangkaian uji keamanan dan validasi parser:
```bash
npm test
```

### Langkah 3: Jalankan Frontend
```bash
cd Frontend-WebKeamanan
npm run dev
```
Aplikasi web akan dapat diakses di `http://localhost:5173`.
