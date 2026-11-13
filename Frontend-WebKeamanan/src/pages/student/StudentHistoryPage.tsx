import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  History,
  CheckCircle,
  XCircle,
  FileText,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const StudentHistoryPage: React.FC = () => {
  const { error: toastError } = useToast();
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/exams/my-history');
        if (res.data.success) {
          setHistory(res.data.history || []);
        }
      } catch (err: any) {
        toastError(err.message || 'Gagal memuat riwayat ujian.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchHistory();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Mengambil arsip lembar ujian Anda..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
          Riwayat Nilai & Evaluasi Ujian
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Daftar seluruh paket ujian yang telah Anda selesaikan beserta skor capaian dan kunci jawaban resmi.
        </p>
      </div>

      {history.length === 0 ? (
        <EmptyState
          icon={History}
          title="Belum Ada Riwayat Ujian"
          description="Anda belum menyelesaikan ujian apa pun. Buka halaman Ujian Tersedia untuk memulai pengerjaan."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase">
                  <th className="py-3.5 px-4">Judul Paket Ujian</th>
                  <th className="py-3.5 px-4">Mata Pelajaran</th>
                  <th className="py-3.5 px-4 text-center">Tanggal Penyerahan</th>
                  <th className="py-3.5 px-4 text-center">Skor Poin</th>
                  <th className="py-3.5 px-4 text-center">Persentase</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {history.map((att) => (
                  <tr key={att.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">{att.exams?.title}</td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {att.exams?.subjects?.name || 'Umum'}
                    </td>
                    <td className="py-3.5 px-4 text-center text-slate-400">
                      {new Date(att.submitted_at || att.started_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                      {att.total_score} / {att.max_score}
                    </td>
                    <td className="py-3.5 px-4 text-center font-extrabold text-navy-950 text-sm">
                      {att.percentage !== null ? `${att.percentage}%` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={att.is_passed ? 'success' : 'danger'}>
                        {att.is_passed ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Lulus
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Remedial
                          </>
                        )}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/student/results/${att.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-royal-50 text-royal-700 hover:bg-royal-100 rounded-lg font-semibold transition"
                      >
                        <span>Tinjau Lembar Soal</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

