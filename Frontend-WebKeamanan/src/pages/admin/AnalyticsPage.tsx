import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const AnalyticsPage: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [dashRes, examRes] = await Promise.all([
          apiClient.get('/dashboard/admin'),
          apiClient.get('/exams/admin/all'),
        ]);
        if (dashRes.data.success) setStats(dashRes.data.stats);
        if (examRes.data.success) setExams(examRes.data.exams || []);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Menghitung statistik analisis pengerjaan..." />;
  }

  const passRate = stats?.passRate || 0;
  const failRate = Math.max(0, 100 - passRate);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
          Analisis Performa & Capaian Akademik
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Visualisasi tingkat kelulusan, ringkasan skor rata-rata, dan evaluasi hasil seluruh peserta ujian.
        </p>
      </div>

      {/* Top High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Tingkat Kelulusan Kumulatif
            </span>
            <div className="text-4xl font-extrabold text-emerald-600 mt-2">{passRate}%</div>
          </div>
          <div className="mt-4">
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
              <div style={{ width: `${passRate}%` }} className="bg-emerald-500 h-full" />
              <div style={{ width: `${failRate}%` }} className="bg-rose-400 h-full" />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 font-semibold mt-2">
              <span>Lulus: {passRate}%</span>
              <span>Remedial: {failRate}%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Rata-Rata Nilai Akhir
            </span>
            <div className="text-4xl font-extrabold text-royal-700 mt-2">
              {stats?.averageScore || 0}
              <span className="text-sm font-semibold text-slate-400 ml-1">/ 100</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Dihitung secara akurat dari seluruh lembar jawaban yang telah diserahkan dan dinilai di backend.
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-subtle flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Ujian Diserahkan
            </span>
            <div className="text-4xl font-extrabold text-navy-950 mt-2">
              {stats?.totalSubmissions || 0}
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-4">
            Seluruh berkas pengerjaan terkunci permanen untuk integritas data.
          </p>
        </div>
      </div>

      {/* Exam Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6">
        <h2 className="text-base font-bold text-navy-950 mb-4">
          Ringkasan Evaluasi per Paket Ujian
        </h2>

        {exams.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            Belum ada paket ujian untuk dianalisis.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="py-3 px-3">Judul Paket Ujian</th>
                  <th className="py-3 px-3">Mata Pelajaran</th>
                  <th className="py-3 px-3 text-center">Durasi</th>
                  <th className="py-3 px-3 text-center">Passing Score</th>
                  <th className="py-3 px-3 text-center">Jumlah Soal</th>
                  <th className="py-3 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {exams.map((ex) => (
                  <tr key={ex.id} className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-3 font-bold text-slate-900">{ex.title}</td>
                    <td className="py-3.5 px-3 text-slate-500">{ex.subjects?.name || 'Umum'}</td>
                    <td className="py-3.5 px-3 text-center">{ex.duration_minutes} Menit</td>
                    <td className="py-3.5 px-3 text-center font-bold text-royal-700">
                      {ex.passing_score}%
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      {ex.exam_questions?.[0]?.count || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <Badge variant={ex.is_published ? 'success' : 'gray'}>
                        {ex.is_published ? 'Published' : 'Draf'}
                      </Badge>
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

