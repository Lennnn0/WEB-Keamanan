# ExamCenter Backend API

Sistem backend aman untuk platform ujian online **ExamCenter**, dibangun menggunakan Node.js, Express, TypeScript, Supabase PostgreSQL, Supabase Auth, dan **Resend Email API**.

---

## 🛡 Fitur Keamanan Utama
1. **Otentikasi Supabase & Role-Based Access Control (RBAC):**
   - Membedakan role `admin` dan `student`.
   - Proteksi ganda di database via Row-Level Security (RLS) dan middleware backend.
   - Kunci Service Role hanya digunakan di server backend.
2. **Multi-Factor Authentication (MFA) Email OTP untuk Administrator:**
   - Admin dapat mengaktifkan/menonaktifkan MFA dari halaman Pengaturan.
   - Ketika aktif, admin wajib memasukkan OTP 6 digit yang dikirim secara aman melalui **Resend Email API**.
   - OTP berumur 5 menit, disimpan dalam database dalam bentuk hash SHA-256 ber-salt (bukan plaintext).
   - Rate limit percobaan maksimal 5 kali, setelah itu dikunci.
   - Single-use: OTP langsung di-burn/diinvalidaikan setelah berhasil diverifikasi.
   - Token tantangan dan sesi admin ditandatangani secara kriptografis menggunakan JWT.
3. **Integritas Ujian & Anti-Bocor:**
   - Kunci jawaban (`correct_answer`) dan pembahasan (`explanation`) tidak pernah dikirim ke browser siswa selama sesi ujian berlangsung.
   - Penilaian dan kalkulasi skor dilakukan sepenuhnya di server.
   - Status pengerjaan langsung dikunci setelah diserahkan (*submitted*) untuk mencegah pengiriman ulang (*double submission*).
4. **Parser & Validasi Impor Soal (CSV & XLSX):**
   - Menggunakan Zod untuk validasi baris per baris.
   - Fitur pratinjau (*preview*) sebelum komit ke basis data.
   - Pelaporan nomor baris spesifik untuk data yang tidak valid.

---

## 📁 Struktur Direktori
```
Backend-WebKeamanan/
├── src/
│   ├── config/          # Konfigurasi Supabase, Resend Client, & Zod Env
│   ├── controllers/     # Logika bisnis endpoint API
│   ├── middlewares/     # Auth, RequireAdmin, RequireStudent, RateLimiter, Zod
│   ├── routes/          # Definisi rute Express
│   ├── services/        # Resend Email Service, Parser CSV/XLSX, Supabase Helpers
│   ├── types/           # Interface TypeScript & Skema Zod
│   ├── utils/           # Fungsi kriptografi & hash OTP
│   └── index.ts         # Server entrypoint
├── supabase/
│   └── migrations/      # Skrip SQL untuk skema, RLS, dan seed data
├── .env.example         # Contoh variabel lingkungan
├── package.json
└── tsconfig.json
```

---

## ⚙️ Panduan Setup & Konfigurasi

### 1. Salin File Environment
```bash
cp .env.example .env
```
Isi variabel lingkungan berikut di `.env`:
- `PORT`: Port server (default: `5000`)
- `CLIENT_URL`: URL frontend (default: `http://localhost:5173`)
- `SUPABASE_URL`: URL proyek Supabase Anda (`https://<project-ref>.supabase.co`)
- `SUPABASE_ANON_KEY`: Kunci anon/public Supabase
- `SUPABASE_SERVICE_ROLE_KEY`: Kunci service role Supabase (Dapatkan dari *Project Settings -> API*)
- `JWT_MFA_SECRET`: Kunci rahasia minimal 32 karakter untuk sesi MFA
- `RESEND_API_KEY`: Kunci API Resend Anda (`re_...`) dari https://resend.com/api-keys
- `RESEND_FROM_EMAIL`: Alamat email pengirim (misal: `ExamCenter Security <onboarding@resend.dev>`)

### 2. Menjalankan SQL Migrations di Supabase
Buka **SQL Editor** pada dashboard Supabase Anda, lalu jalankan file berikut secara berurutan:
1. `supabase/migrations/01_schema.sql` (Tabel, relasi, indeks, triggers)
2. `supabase/migrations/02_rls_policies.sql` (Aturan keamanan RLS dan fungsi admin)
3. `supabase/migrations/03_seed_data.sql` (Mata pelajaran dan contoh soal awal)

### 3. Menjalankan Server
```bash
# Mode Pengembangan (dengan auto-reload)
npm run dev

# Menjalankan Test Suite Keamanan & MFA
npm test

# Build TypeScript Produksi
npm run build

# Menjalankan versi kompilasi
npm start
```
