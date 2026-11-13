import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  CLIENT_URL: z.string().default('http://localhost:5173'),
  SUPABASE_URL: z.string().min(1, 'SUPABASE_URL is required'),
  SUPABASE_ANON_KEY: z.string().min(1, 'SUPABASE_ANON_KEY is required'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
  JWT_MFA_SECRET: z.string().min(10, 'JWT_MFA_SECRET must be at least 10 characters').default('examcenter-jwt-super-secret-key-32chars'),
  RESEND_API_KEY: z.string().optional().or(z.literal('')),
  RESEND_FROM_EMAIL: z.string().default('ExamCenter Security <onboarding@resend.dev>'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.warn('⚠️ Environment validation warnings (some features may run with mock or defaults if not filled):');
  console.warn(JSON.stringify(parsed.error.format(), null, 2));
}

export const ENV = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
  SUPABASE_URL: process.env.SUPABASE_URL || 'https://placeholder-project.supabase.co',
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
  JWT_MFA_SECRET: process.env.JWT_MFA_SECRET || 'examcenter-jwt-super-secret-key-32chars',
  RESEND_API_KEY: process.env.RESEND_API_KEY || '',
  RESEND_FROM_EMAIL: process.env.RESEND_FROM_EMAIL || 'ExamCenter Security <onboarding@resend.dev>',
  isConfigured: {
    supabase: Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY && !process.env.SUPABASE_URL.includes('placeholder')),
    resend: Boolean(process.env.RESEND_API_KEY && process.env.RESEND_API_KEY.trim() !== ''),
  }
};
