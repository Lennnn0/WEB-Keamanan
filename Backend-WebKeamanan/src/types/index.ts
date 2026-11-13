import { z } from 'zod';
import { Request } from 'express';

// Role Definitions
export type UserRole = 'admin' | 'student';

// Extended Express Request with Authenticated User
export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  mfaVerified?: boolean;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

// ============================================================================
// Auth Zod Schemas
// ============================================================================

export const registerSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(8, 'Password minimal harus 8 karakter'),
  fullName: z.string().min(2, 'Nama lengkap minimal 2 karakter'),
});

export const loginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const verifyOtpSchema = z.object({
  challengeToken: z.string().min(1, 'Challenge token wajib disertakan'),
  otp: z.string().length(6, 'Kode OTP harus tepat 6 digit angka').regex(/^\d{6}$/, 'OTP hanya boleh berisi angka'),
});

export const resendOtpSchema = z.object({
  challengeToken: z.string().min(1, 'Challenge token wajib disertakan'),
});

export const toggleMfaSchema = z.object({
  enabled: z.boolean(),
});

// ============================================================================
// Question Schemas
// ============================================================================

export const createQuestionSchema = z.object({
  subjectId: z.string().uuid().optional().nullable(),
  subjectName: z.string().min(1, 'Nama mata pelajaran wajib diisi').default('Umum'),
  questionText: z.string().min(3, 'Teks pertanyaan minimal 3 karakter'),
  optionA: z.string().min(1, 'Pilihan A wajib diisi'),
  optionB: z.string().min(1, 'Pilihan B wajib diisi'),
  optionC: z.string().min(1, 'Pilihan C wajib diisi'),
  optionD: z.string().min(1, 'Pilihan D wajib diisi'),
  correctAnswer: z.enum(['A', 'B', 'C', 'D'], {
    errorMap: () => ({ message: 'Jawaban benar harus berupa salah satu dari A, B, C, atau D' }),
  }),
  explanation: z.string().optional().nullable(),
  difficulty: z.enum(['easy', 'medium', 'hard']).default('medium'),
  points: z.number().positive().default(1),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// ============================================================================
// Import Question Row Schema (for CSV / XLSX)
// ============================================================================

export const importQuestionRowSchema = z.object({
  question: z.string().min(3, 'Pertanyaan minimal 3 karakter'),
  option_a: z.string().min(1, 'Pilihan A wajib diisi'),
  option_b: z.string().min(1, 'Pilihan B wajib diisi'),
  option_c: z.string().min(1, 'Pilihan C wajib diisi'),
  option_d: z.string().min(1, 'Pilihan D wajib diisi'),
  correct_answer: z.preprocess(
    (val) => String(val || '').trim().toUpperCase(),
    z.enum(['A', 'B', 'C', 'D'], {
      errorMap: () => ({ message: 'Jawaban benar harus berupa A, B, C, atau D' }),
    })
  ),
  subject: z.string().optional().default('Umum'),
  difficulty: z.preprocess(
    (val) => String(val || 'medium').trim().toLowerCase(),
    z.enum(['easy', 'medium', 'hard']).default('medium')
  ),
  explanation: z.string().optional().default(''),
  points: z.preprocess(
    (val) => (val !== undefined && val !== null && val !== '' ? Number(val) : 1),
    z.number().positive('Poin harus lebih dari 0').default(1)
  ),
});

export type ImportQuestionRow = z.infer<typeof importQuestionRowSchema>;

// ============================================================================
// Exam Schemas
// ============================================================================

export const createExamSchema = z.object({
  title: z.string().min(3, 'Judul ujian minimal 3 karakter'),
  description: z.string().optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  durationMinutes: z.number().int().positive('Durasi ujian harus lebih dari 0 menit'),
  passingScore: z.number().min(0).max(100, 'Nilai kelulusan antara 0 - 100').default(70),
  isPublished: z.boolean().default(false),
  startTime: z.string().datetime().optional().nullable(),
  endTime: z.string().datetime().optional().nullable(),
  shuffleQuestions: z.boolean().default(false),
  shuffleOptions: z.boolean().default(false),
  questionIds: z.array(z.string().uuid()).min(1, 'Pilih minimal satu soal untuk ujian'),
});

export const updateExamSchema = createExamSchema.partial();

export const saveAnswerSchema = z.object({
  questionId: z.string().uuid('ID soal tidak valid'),
  selectedOption: z.enum(['A', 'B', 'C', 'D']).nullable(),
});

// ============================================================================
// Study Material & Schedule Schemas
// ============================================================================

export const createMaterialSchema = z.object({
  title: z.string().min(2, 'Judul materi minimal 2 karakter'),
  description: z.string().optional().nullable(),
  subjectId: z.string().uuid().optional().nullable(),
  fileUrl: z.string().url('URL materi tidak valid').or(z.string().min(1)),
  fileName: z.string().min(1),
  contentType: z.string().default('application/pdf'),
});

export const createScheduleSchema = z.object({
  examId: z.string().uuid('ID ujian wajib dipilih'),
  title: z.string().min(2, 'Judul jadwal minimal 2 karakter'),
  startTime: z.string().datetime('Format tanggal mulai tidak valid'),
  endTime: z.string().datetime('Format tanggal selesai tidak valid'),
  status: z.enum(['scheduled', 'active', 'completed', 'cancelled']).default('scheduled'),
});

