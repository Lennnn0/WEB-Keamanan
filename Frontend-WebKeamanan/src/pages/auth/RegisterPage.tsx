import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { Lock, Mail, User, Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fullName || !email || !password) {
      toastError('Mohon lengkapi seluruh formulir pendaftaran.');
      return;
    }

    if (password.length < 8) {
      toastError('Password minimal harus 8 karakter demi keamanan akun.');
      return;
    }

    if (password !== confirmPassword) {
      toastError('Konfirmasi password tidak cocok dengan password yang dimasukkan.');
      return;
    }

    setIsLoading(true);
    try {
      await register(email, password, fullName);
      toastSuccess('Pendaftaran berhasil! Selamat datang di portal siswa ExamCenter.');
      navigate('/student');
    } catch (err: any) {
      toastError(err.message || 'Gagal mendaftar. Silakan coba kembali.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Registrasi Siswa Baru"
      subtitle="Buat akun siswa untuk mengakses materi pelajaran dan jadwal ujian."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Nama Lengkap Siswa
          </label>
          <div className="relative">
            <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ahmad Fauzi"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-royal-600 focus:ring-4 focus:ring-royal-100 focus:outline-none transition-all shadow-subtle"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Alamat Email Aktif
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="siswa@sekolah.sch.id"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-royal-600 focus:ring-4 focus:ring-royal-100 focus:outline-none transition-all shadow-subtle"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Password (Minimal 8 Karakter)
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-royal-600 focus:ring-4 focus:ring-royal-100 focus:outline-none transition-all shadow-subtle"
            />
          </div>
          {/* Password strength helper */}
          {password && (
            <div className="mt-1.5 flex items-center space-x-1 text-[11px] text-slate-500">
              <span className={`h-1 flex-1 rounded-full ${password.length >= 8 ? 'bg-emerald-500' : 'bg-amber-400'}`} />
              <span>{password.length >= 8 ? 'Panjang memenuhi syarat' : 'Kurang dari 8 karakter'}</span>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Konfirmasi Password
          </label>
          <div className="relative">
            <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-royal-600 focus:ring-4 focus:ring-royal-100 focus:outline-none transition-all shadow-subtle"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full mt-2 flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-navy-950 via-royal-700 to-royal-600 text-white font-semibold rounded-xl hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-royal-600/20 text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Mendaftarkan Akun...
            </>
          ) : (
            <>
              Daftar Sekarang
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
        <p className="text-sm text-slate-500">
          Sudah terdaftar sebagai siswa atau admin?{' '}
          <Link to="/login" className="font-bold text-royal-600 hover:text-royal-800 transition">
            Masuk ke Akun
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
};

