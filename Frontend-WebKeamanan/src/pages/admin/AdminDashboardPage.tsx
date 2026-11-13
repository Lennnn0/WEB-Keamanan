import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import {
  Users,
  BookMarked,
  HelpCircle,
  TrendingUp,
  FileSpreadsheet,
  PlusCircle,
  FileText,
  Calendar,
  Activity,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';

export const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await apiClient.get('/dashboard/admin');
        if (res.data.success) {
          setStats(res.data.stats);
          setActivities(res.data.recentActivity || []);
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Menyiapkan data dashboard administrator..." />;
  }

  const statCards = [
    {
      label: 'Total Siswa Terdaftar',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'from-blue-600 to-royal-700',
      textColor: 'text-royal-600',
      bgColor: 'bg-royal-50',
    },
    {
      label: 'Ujian Tersedia',
      value: stats?.totalExams || 0,
      icon: BookMarked,
      color: 'from-indigo-600 to-indigo-700',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      label: 'Total Butir Soal Bank',
      value: stats?.totalQuestions || 0,
      icon: HelpCircle,
      color: 'from-navy-800 to-navy-950',
      textColor: 'text-navy-900',
      bgColor: 'bg-navy-50',
    },
    {
      label: 'Tingkat Kelulusan',
      value: `${stats?.passRate || 0}%`,
      subvalue: `Rata-rata skor: ${stats?.averageScore || 0}`,
      icon: TrendingUp,
      color: 'from-emerald-600 to-teal-700',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-navy-950 via-navy-900 to-royal-950 rounded-2xl p-6 sm:p-8 text-white shadow-premium">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 bg-royal-500/20 border border-royal-400/30 rounded-full text-royal-300 text-xs font-semibold mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pusat Kendali Evaluasi Akademik</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Utama Administrator
          </h1>
          <p className="mt-2 text-sm text-slate-300 leading-relaxed">
            Pantau metrik pelaksanaan ujian, kelola distribusi bank soal, dan evaluasi hasil pengerjaan siswa secara aman dan terintegrasi.
          </p>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-premium transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {card.label}
                </span>
                <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.textColor}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-3xl font-extrabold text-navy-950">{card.value}</div>
                {card.subvalue && (
                  <p className="mt-1 text-xs text-slate-500 font-medium">{card.subvalue}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-base font-bold text-navy-950 mb-4">Aksi Cepat Manajemen</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            to="/admin/exams"
            className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-royal-500 hover:shadow-premium transition flex items-center justify-between"
          >
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-royal-50 text-royal-600 rounded-lg group-hover:bg-royal-600 group-hover:text-white transition">
                <PlusCircle className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Buat Ujian Baru</div>
                <div className="text-xs text-slate-500">Susun paket evaluasi</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-royal-600 transition" />
          </Link>

          <Link
            to="/admin/import"
            className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-royal-500 hover:shadow-premium transition flex items-center justify-between"
          >
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-600 group-hover:text-white transition">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Impor Soal Excel</div>
                <div className="text-xs text-slate-500">Upload CSV / XLSX</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 transition" />
          </Link>

          <Link
            to="/admin/materials"
            className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-royal-500 hover:shadow-premium transition flex items-center justify-between"
          >
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-600 group-hover:text-white transition">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Unggah Materi</div>
                <div className="text-xs text-slate-500">Bahan ajar siswa</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition" />
          </Link>

          <Link
            to="/admin/schedules"
            className="group p-5 bg-white border border-slate-200 rounded-xl hover:border-royal-500 hover:shadow-premium transition flex items-center justify-between"
          >
            <div className="flex items-center space-x-3.5">
              <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Jadwalkan Ujian</div>
                <div className="text-xs text-slate-500">Waktu & batasan akses</div>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
          </Link>
        </div>
      </div>

      {/* Activity Logs Section */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-royal-600" />
            <h2 className="text-base font-bold text-navy-950">Log Aktivitas Sistem & Keamanan</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Audit Trail Realtime</span>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            Belum ada aktivitas baru yang tercatat dalam audit log.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 px-3">Waktu</th>
                  <th className="pb-3 px-3">Tindakan</th>
                  <th className="pb-3 px-3">Kategori</th>
                  <th className="pb-3 px-3">Pelaku</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-600">
                {activities.map((act) => (
                  <tr key={act.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-3 text-slate-400">
                      {new Date(act.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {act.action}
                    </td>
                    <td className="py-3 px-3">
                      <Badge variant="navy">{act.entity_type}</Badge>
                    </td>
                    <td className="py-3 px-3">
                      {act.profiles?.full_name || act.profiles?.email || 'Sistem'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

