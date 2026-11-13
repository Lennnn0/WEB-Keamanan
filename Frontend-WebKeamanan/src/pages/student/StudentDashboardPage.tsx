import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import {
  BookOpenCheck,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  ArrowRight,
  ExternalLink,
  Shield,
} from 'lucide-react';

export const StudentDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDashboard = async () => {
      try {
        const res = await apiClient.get('/dashboard/student');
        if (res.data.success) {
          setDashboardData(res.data);
        }
      } catch (err) {
        console.error('Failed to load student dashboard:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentDashboard();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Menyiapkan portal siswa..." />;
  }

  const stats = dashboardData?.stats;
  const recentAttempts = dashboardData?.recentAttempts || [];
  const materials = dashboardData?.recommendedMaterials || [];

  return (
    <div className="space-y-8">
      {/* Welcome Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-navy-950 via-royal-950 to-navy-900 rounded-3xl p-6 sm:p-10 text-white shadow-premium">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-royal-500/20 border border-royal-400/30 rounded-full text-royal-300 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Portal Siswa Terverifikasi</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Selamat Datang, {user?.full_name}!
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Periksa ketersediaan paket ujian terbaru, pelajari materi bahan ajar, dan tinjau riwayat pencapaian akademik Anda.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/student/exams"
              className="inline-flex items-center px-5 py-2.5 bg-royal-600 text-white font-semibold text-sm rounded-xl hover:bg-royal-700 transition shadow-lg shadow-royal-600/30"
            >
              Lihat Ujian Tersedia
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/student/materials"
              className="inline-flex items-center px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl transition"
            >
              Materi Belajar
            </Link>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Ujian Tersedia</span>
            <div className="p-2 bg-royal-50 text-royal-600 rounded-lg">
              <BookOpenCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-navy-950 mt-3">
            {stats?.pendingExamsCount || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Siap untuk dikerjakan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Ujian Diselesaikan</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-navy-950 mt-3">
            {stats?.completedExamsCount || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Telah diserahkan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Rata-Rata Nilai</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-royal-700 mt-3">
            {stats?.averageScore || 0}
          </div>
          <p className="text-xs text-slate-400 mt-1">Skor kumulatif</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Kelulusan</span>
            <div className="p-2 bg-teal-50 text-teal-600 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-emerald-700 mt-3">
            {stats?.passedCount || 0} Ujian
          </div>
          <p className="text-xs text-slate-400 mt-1">Memenuhi passing score</p>
        </div>
      </div>

      {/* Main Sections: Recent Attempts & Materials */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Attempts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-navy-950">Aktivitas Evaluasi Terbaru</h2>
            <Link
              to="/student/history"
              className="text-xs font-semibold text-royal-600 hover:text-royal-800 transition"
            >
              Lihat Semua Riwayat
            </Link>
          </div>

          {recentAttempts.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Anda belum pernah mengerjakan ujian. Mulai ujian pertama Anda sekarang!
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAttempts.map((att: any) => (
                <div key={att.id} className="py-3.5 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{att.exams?.title}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Diserahkan: {new Date(att.submitted_at || att.started_at).toLocaleDateString('id-ID')}
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 text-right">
                    <div>
                      <div className="text-base font-extrabold text-navy-950">
                        {att.percentage !== null ? `${att.percentage}%` : '-'}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Poin: {att.total_score} / {att.max_score}
                      </div>
                    </div>

                    <Badge variant={att.is_passed ? 'success' : 'danger'}>
                      {att.is_passed ? 'Lulus' : 'Remedial'}
                    </Badge>

                    <Link
                      to={`/student/results/${att.id}`}
                      className="p-1.5 text-royal-600 hover:bg-royal-50 rounded-lg text-xs font-semibold transition"
                    >
                      Buka Hasil
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recommended Materials */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-navy-950">Materi Referensi</h2>
            <Link
              to="/student/materials"
              className="text-xs font-semibold text-royal-600 hover:text-royal-800 transition"
            >
              Semua
            </Link>
          </div>

          {materials.length === 0 ? (
            <div className="text-center py-10 text-xs text-slate-400">
              Belum ada materi pembelajaran yang diunggah.
            </div>
          ) : (
            <div className="space-y-3">
              {materials.map((mat: any) => (
                <div
                  key={mat.id}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl hover:bg-royal-50/50 transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3 min-w-0 pr-2">
                    <div className="p-2 bg-white text-royal-600 rounded-lg shadow-2xs flex-shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-800 truncate">{mat.title}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {mat.file_name || 'Dokumen Pelajaran'}
                      </div>
                    </div>
                  </div>

                  <a
                    href={mat.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 text-royal-600 hover:bg-royal-100 rounded-lg transition"
                    title="Buka Materi"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

