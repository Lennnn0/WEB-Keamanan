-- ==============================================================================
-- ExamCenter Initial Seed Data - Migration 03
-- Subjects & Default Initial Data
-- ==============================================================================

-- Insert Initial Subjects
INSERT INTO public.subjects (id, name, code, description) VALUES
('11111111-1111-1111-1111-111111111101', 'Keamanan Web & Jaringan', 'SEC-101', 'Mata kuliah konsep dasar keamanan web, OWASP Top 10, otentikasi MFA, dan proteksi jaringan.'),
('11111111-1111-1111-1111-111111111102', 'Kriptografi & Integritas Data', 'SEC-202', 'Prinsip kriptografi simetris, asimetris, hashing SHA-256, digital signature, dan sertifikat TLS.'),
('11111111-1111-1111-1111-111111111103', 'Sistem Basis Data & RLS', 'DB-301', 'Manajemen relasional PostgreSQL, Row-Level Security, ACID transactions, dan optimasi query.'),
('11111111-1111-1111-1111-111111111104', 'Rekayasa Perangkat Lunak Aman', 'DEV-401', 'Secure SDLC, code review, validasi input, sanitasi data, dan vulnerability management.')
ON CONFLICT (code) DO NOTHING;

-- Insert Sample Questions for Testing Question Bank and Exam Generation
INSERT INTO public.questions (
  id, subject_id, subject_name, question_text, option_a, option_b, option_c, option_d, correct_answer, explanation, difficulty, points
) VALUES
(
  '22222222-2222-2222-2222-222222222201',
  '11111111-1111-1111-1111-111111111101',
  'Keamanan Web & Jaringan',
  'Manakah dari mekanisme berikut yang paling efektif untuk mencegah serangan Cross-Site Request Forgery (CSRF)?',
  'Menggunakan HTTPS pada seluruh jalur komunikasi',
  'Menerapkan Anti-CSRF Token berbasis sinkronisasi acak dan SameSite cookie attribute',
  'Menyimpan password dalam plaintext di LocalStorage',
  'Menonaktifkan CORS pada web browser',
  'B',
  'Anti-CSRF token yang unik untuk setiap sesi/request dan konfigurasi cookie SameSite mencegah browser otomatis mengirimkan kredensial dalam request lintas-domain.',
  'medium',
  1
),
(
  '22222222-2222-2222-2222-222222222202',
  '11111111-1111-1111-1111-111111111101',
  'Keamanan Web & Jaringan',
  'Dalam implementasi Multi-Factor Authentication (MFA) berbasis One-Time Password (OTP), manakah praktik keamanan yang paling wajib dipatuhi backend?',
  'Menyimpan kode OTP mentah dalam database agar mudah dibaca admin',
  'Membuat OTP berlaku selamanya sampai user berhasil login',
  'Menyimpan OTP dalam bentuk hash, membatasi masa berlaku (misal 5 menit), rate-limiting percobaan, dan sekali pakai',
  'Mengirimkan OTP dan password dalam URL query parameter',
  'C',
  'OTP harus berumur pendek (misalnya 5 menit), disimpan dalam bentuk hash satu arah, memiliki batas percobaan (misal 5x), dan langsung dibakar (invalidated) setelah sekali digunakan.',
  'easy',
  1
),
(
  '22222222-2222-2222-2222-222222222203',
  '11111111-1111-1111-1111-111111111102',
  'Kriptografi & Integritas Data',
  'Fungsi hash kriptografis yang aman memiliki sifat collision resistance. Apa yang dimaksud dengan sifat tersebut?',
  'Sangat mudah menemukan dua pesan berbeda M1 dan M2 yang menghasilkan output hash H(M1) = H(M2)',
  'Secara komputasi tidak praktis (sangat sulit) menemukan dua pesan berbeda yang menghasilkan nilai hash yang sama',
  'Hash dapat didekripsi kembali menjadi teks asli dalam waktu konstan',
  'Kunci enkripsi publik harus dirahasiakan dari publik',
  'B',
  'Collision resistance menjamin bahwa sangat mustahil menemukan dua input berbeda yang memiliki ringkasan hash identik.',
  'hard',
  2
),
(
  '22222222-2222-2222-2222-222222222204',
  '11111111-1111-1111-1111-111111111103',
  'Sistem Basis Data & RLS',
  'Apa keuntungan utama menerapkan Row-Level Security (RLS) di lapisan PostgreSQL dibanding hanya memfilter data di frontend?',
  'Frontend tidak perlu mengunduh data apa pun lagi',
  'Memastikan isolasi data terjadi di tingkat database engine sehingga query ilegal dari client/API tidak membocorkan data antar-pengguna',
  'Meningkatkan latensi jaringan server',
  'Menghilangkan kebutuhan backup database berkala',
  'B',
  'RLS menjamin penegakan aturan akses langsung oleh mesin basis data terlepas dari bagaimana client meminta query, mencegah kebocoran data jika ada celah di API/client.',
  'medium',
  1
)
ON CONFLICT (id) DO NOTHING;

