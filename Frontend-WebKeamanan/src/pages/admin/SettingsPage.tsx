import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Mail,
  User,
  CheckCircle,
  AlertTriangle,
  Server,
  KeyRound,
  Shield,
  Loader2,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  const [isMfaEnabled, setIsMfaEnabled] = useState<boolean>(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isToggling, setIsToggling] = useState<boolean>(false);

  const fetchMfaStatus = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/auth/mfa-status');
      if (res.data.success) {
        setIsMfaEnabled(res.data.isMfaEnabled);
        setUpdatedAt(res.data.updatedAt);
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat status MFA admin.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMfaStatus();
  }, []);

  const handleToggleMfa = async () => {
    const nextStatus = !isMfaEnabled;
    setIsToggling(true);

    try {
      const res = await apiClient.post('/auth/toggle-mfa', {
        enabled: nextStatus,
      });

      if (res.data.success) {
        setIsMfaEnabled(res.data.isMfaEnabled);
        toastSuccess(res.data.message);
        await refreshUser();
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal memperbarui status MFA.');
    } finally {
      setIsToggling(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Memuat setelan keamanan akun..." />;
  }

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
          Pengaturan Akun & Keamanan Sistem
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Konfigurasi profil administrator dan atur proteksi otentikasi ganda Multi-Factor Authentication (MFA).
        </p>
      </div>

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6">
        <h2 className="text-base font-bold text-navy-950 mb-4 flex items-center space-x-2">
          <User className="w-5 h-5 text-royal-600" />
          <span>Profil Administrator</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Nama Lengkap</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">
              {user?.full_name || 'Administrator'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Alamat Email</span>
            <span className="text-sm font-bold text-slate-800 mt-1 block">{user?.email}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Hak Akses Role</span>
            <div className="mt-1">
              <Badge variant="navy">ADMINISTRATOR LEVEL</Badge>
            </div>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl">
            <span className="text-[11px] font-bold text-slate-400 uppercase block">Otentikasi Basis Data</span>
            <span className="text-xs font-semibold text-emerald-700 mt-1 flex items-center">
              <CheckCircle className="w-3.5 h-3.5 mr-1 text-emerald-600" />
              Supabase Auth & Row Level Security (RLS)
            </span>
          </div>
        </div>
      </div>

      {/* MFA Security Center Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-navy-950 to-navy-900 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-12 h-12 rounded-xl bg-royal-600/30 border border-royal-400/30 flex items-center justify-center text-royal-400">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Multi-Factor Authentication (OTP Email)</h2>
              <p className="text-xs text-slate-300">
                Proteksi lapis kedua via Resend Email API untuk mencegah pembobolan akun admin.
              </p>
            </div>
          </div>

          <div>
            {isMfaEnabled ? (
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                <ShieldCheck className="w-4 h-4 mr-1.5" />
                MFA AKTIF
              </span>
            ) : (
              <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                <ShieldAlert className="w-4 h-4 mr-1.5" />
                MFA NONAKTIF
              </span>
            )}
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-6">
          {/* Toggle Control */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 bg-slate-50 border border-slate-200/80 rounded-2xl gap-4">
            <div>
              <div className="font-bold text-slate-900 text-sm">
                Status Keamanan Verifikasi Email OTP
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {isMfaEnabled
                  ? 'Setiap kali Anda masuk menggunakan password, kode OTP 6 digit akan dikirimkan ke alamat email terdaftar dan wajib diverifikasi sebelum hak akses admin diberikan.'
                  : 'Saat dinonaktifkan, akun admin hanya memerlukan email dan password untuk masuk. Mengaktifkan MFA sangat disarankan untuk proteksi maksimal.'}
              </p>
            </div>

            <button
              onClick={handleToggleMfa}
              disabled={isToggling}
              className={`flex-shrink-0 inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-xs tracking-wider uppercase transition shadow-sm ${
                isMfaEnabled
                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                  : 'bg-gradient-to-r from-emerald-600 to-teal-700 text-white hover:opacity-95 shadow-emerald-600/20'
              }`}
            >
              {isToggling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Menyimpan...
                </>
              ) : isMfaEnabled ? (
                'Nonaktifkan MFA'
              ) : (
                'Aktifkan MFA Sekarang'
              )}
            </button>
          </div>

          {/* Security Features Breakdown */}
          <div className="border-t border-slate-100 pt-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">
              Mekanisme Standar Keamanan OTP ExamCenter:
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start space-x-3">
                <KeyRound className="w-5 h-5 text-royal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Hashing SHA-256 Satu Arah</div>
                  <p className="text-slate-500 mt-0.5">
                    Kode OTP tidak pernah disimpan dalam bentuk plaintext di database, melainkan dienkripsi dengan salt khusus.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start space-x-3">
                <Lock className="w-5 h-5 text-royal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Masa Berlaku 5 Menit & Sekali Pakai</div>
                  <p className="text-slate-500 mt-0.5">
                    Kode langsung kedaluwarsa setelah 5 menit dan otomatis dihanguskan (single-use) setelah sekali berhasil diverifikasi.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Batas Percobaan Maksimal 5 Kali</div>
                  <p className="text-slate-500 mt-0.5">
                    Sistem mengunci tantangan login jika terjadi kesalahan memasukkan OTP berulang untuk menangkal brute-force.
                  </p>
                </div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start space-x-3">
                <Mail className="w-5 h-5 text-royal-600 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-800">Pengiriman Transaksi via Resend API</div>
                  <p className="text-slate-500 mt-0.5">
                    Email notifikasi dikirimkan langsung melalui Resend REST API dengan enkripsi TLS tingkat tinggi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

