import React from 'react';
import { Shield, CheckCircle, Lock, BookOpen } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Column: Security Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-950 via-navy-900 to-royal-950 p-12 text-white flex-col justify-between relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 bg-royal-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-royal-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-royal-500/30">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight">ExamCenter</span>
          </div>

          <div className="inline-flex items-center space-x-2 mt-4 px-3 py-1 bg-royal-500/10 border border-royal-400/20 rounded-full text-royal-300 text-xs font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>Sistem Ujian Terisolasi Berstandar Keamanan Tinggi</span>
          </div>
        </div>

        <div className="relative z-10 my-auto py-12">
          <h1 className="text-4xl font-extrabold tracking-tight text-white leading-tight">
            Pelaksanaan Ujian Terpercaya dengan Proteksi Multi-Lapis.
          </h1>
          <p className="mt-4 text-base text-slate-300 leading-relaxed max-w-lg">
            Platform evaluasi akademik modern yang dilengkapi dengan otentikasi Supabase, proteksi Multi-Factor Authentication (OTP Email) via Resend API, dan mitigasi kecurangan otomatis.
          </p>

          <div className="mt-8 space-y-3">
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Kunci jawaban terisolasi murni di server (zero client leak)</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Verifikasi MFA OTP 6 Digit untuk akun Administrator</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-slate-300">
              <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Validasi Impor Soal CSV/XLSX baris per baris dengan transaksi atomik</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-6">
          <span>&copy; {new Date().getFullYear()} ExamCenter Systems</span>
          <span className="flex items-center space-x-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Dokumentasi Keamanan v2.4</span>
          </span>
        </div>
      </div>

      {/* Right Column: Form Container */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-16">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-center space-x-2 mb-8">
            <div className="w-8 h-8 rounded-lg bg-royal-600 flex items-center justify-center text-white">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-navy-950">ExamCenter</span>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">{title}</h2>
            <p className="mt-2 text-sm text-slate-500">{subtitle}</p>
          </div>

          {children}
        </div>
      </div>
    </div>
  );
};

