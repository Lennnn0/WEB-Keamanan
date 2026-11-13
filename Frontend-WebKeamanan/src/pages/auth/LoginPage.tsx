import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { AuthLayout } from '../../components/layouts/AuthLayout';
import { OtpModal } from '../../components/auth/OtpModal';
import { Lock, Mail, Loader2, ArrowRight, ShieldCheck, UserCheck } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, verifyMfaOtp, resendMfaOtp } = useAuth();
  const { error: toastError, success: toastSuccess } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // MFA State
  const [mfaState, setMfaState] = useState<{
    isOpen: boolean;
    challengeToken: string;
    emailMasked: string;
    expiresInSeconds: number;
  }>({
    isOpen: false,
    challengeToken: '',
    emailMasked: '',
    expiresInSeconds: 300,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toastError('Mohon isi alamat email dan password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await login(email, password);

      // 1. If MFA is required for Admin
      if (res.mfaRequired && res.challengeToken) {
        setMfaState({
          isOpen: true,
          challengeToken: res.challengeToken,
          emailMasked: res.emailMasked || email,
          expiresInSeconds: res.expiresInSeconds || 300,
        });
        toastSuccess('Kredensial valid! Silakan masukkan kode OTP yang dikirim ke email admin.');
        return;
      }

      // 2. Direct login (student or admin without MFA)
      toastSuccess('Berhasil masuk! Selamat datang di ExamCenter.');
      if (res.user?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/student');
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSuccess = () => {
    setMfaState((prev) => ({ ...prev, isOpen: false }));
    toastSuccess('Otentikasi MFA Administrator Berhasil diverifikasi!');
    navigate('/admin');
  };

  return (
    <AuthLayout
      title="Selamat Datang Kembali"
      subtitle="Masuk ke portal akun Anda untuk mengakses sistem ujian."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Alamat Email
          </label>
          <div className="relative">
            <Mail className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@institusi.ac.id"
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:border-royal-600 focus:ring-4 focus:ring-royal-100 focus:outline-none transition-all shadow-subtle"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Password Akun
            </label>
          </div>
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
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-navy-950 via-royal-700 to-royal-600 text-white font-semibold rounded-xl hover:opacity-95 disabled:opacity-50 transition-all shadow-lg shadow-royal-600/20 text-sm"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Memverifikasi Kredensial...
            </>
          ) : (
            <>
              Masuk Sekarang
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </form>

      <div className="mt-8 pt-6 border-t border-slate-200/80 text-center">
        <p className="text-sm text-slate-500">
          Belum memiliki akun siswa?{' '}
          <Link to="/register" className="font-bold text-royal-600 hover:text-royal-800 transition">
            Daftar Akun Siswa
          </Link>
        </p>
      </div>

      {/* Info Card */}
      <div className="mt-6 p-3.5 bg-royal-50/60 border border-royal-100 rounded-xl flex items-start space-x-3 text-xs text-royal-900">
        <ShieldCheck className="w-4 h-4 text-royal-600 flex-shrink-0 mt-0.5" />
        <p>
          <strong>Informasi Keamanan:</strong> Akun Administrator yang telah mengaktifkan MFA akan secara otomatis diarahkan ke verifikasi kode OTP email setelah password diverifikasi.
        </p>
      </div>

      {/* MFA Modal Dialog */}
      <OtpModal
        isOpen={mfaState.isOpen}
        onClose={() => setMfaState((prev) => ({ ...prev, isOpen: false }))}
        challengeToken={mfaState.challengeToken}
        emailMasked={mfaState.emailMasked}
        initialExpirySeconds={mfaState.expiresInSeconds}
        onSuccess={handleMfaSuccess}
        onVerify={verifyMfaOtp}
        onResend={resendMfaOtp}
      />
    </AuthLayout>
  );
};

