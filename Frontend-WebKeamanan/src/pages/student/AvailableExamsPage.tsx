import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  BookOpenCheck,
  Clock,
  Award,
  ArrowRight,
  CheckCircle,
  PlayCircle,
  FileCheck,
} from 'lucide-react';

export const AvailableExamsPage: React.FC = () => {
  const { error: toastError } = useToast();
  const navigate = useNavigate();

  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableExams = async () => {
      try {
        const res = await apiClient.get('/exams/available');
        if (res.data.success) {
          setExams(res.data.exams || []);
        }
      } catch (err: any) {
        toastError(err.message || 'Gagal memuat daftar ujian.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableExams();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Mengecek paket ujian yang dapat Anda akses..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
          Paket Ujian Tersedia
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Daftar evaluasi akademik resmi yang telah dipublikasikan oleh administrator dan siap dikerjakan.
        </p>
      </div>

      {exams.length === 0 ? (
        <EmptyState
          icon={BookOpenCheck}
          title="Tidak Ada Ujian Aktif Saat Ini"
          description="Saat ini belum ada paket ujian yang dipublikasikan untuk kelas Anda. Silakan periksa kembali nanti."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const status = exam.status; // 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED'
            const attempt = exam.userAttempt;

            return (
              <div
                key={exam.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle hover:shadow-premium transition flex flex-col justify-between overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-royal-600 bg-royal-50 px-2.5 py-1 rounded-full">
                      {exam.subjects?.name || 'Umum'}
                    </span>

                    {status === 'COMPLETED' ? (
                      <Badge variant={attempt?.is_passed ? 'success' : 'danger'}>
                        {attempt?.is_passed ? 'Lulus' : 'Remedial'}
                      </Badge>
                    ) : status === 'IN_PROGRESS' ? (
                      <Badge variant="warning">Sedang Berlangsung</Badge>
                    ) : (
                      <Badge variant="primary">Tersedia</Badge>
                    )}
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                    {exam.description || 'Tidak ada deskripsi ujian khusus.'}
                  </p>

                  <div className="mt-5 grid grid-cols-2 gap-2 py-3 border-y border-slate-100 text-center text-xs">
                    <div className="flex items-center justify-center space-x-1.5 text-slate-600">
                      <Clock className="w-4 h-4 text-royal-600" />
                      <span>
                        Durasi: <strong>{exam.duration_minutes} Menit</strong>
                      </span>
                    </div>

                    <div className="flex items-center justify-center space-x-1.5 text-slate-600">
                      <Award className="w-4 h-4 text-emerald-600" />
                      <span>
                        KKM: <strong>{exam.passing_score}%</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Action Button */}
                <div className="p-4 bg-slate-50 border-t border-slate-100">
                  {status === 'COMPLETED' ? (
                    <Link
                      to={`/student/results/${attempt.id}`}
                      className="w-full flex items-center justify-center py-2.5 px-4 bg-slate-800 text-white font-semibold text-xs rounded-xl hover:bg-slate-900 transition shadow-sm"
                    >
                      <FileCheck className="w-4 h-4 mr-1.5" />
                      Tinjau Hasil Nilai ({attempt.percentage}%)
                    </Link>
                  ) : status === 'IN_PROGRESS' ? (
                    <Link
                      to={`/student/exams/${exam.id}/take`}
                      className="w-full flex items-center justify-center py-2.5 px-4 bg-amber-600 text-white font-semibold text-xs rounded-xl hover:bg-amber-700 transition shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4 mr-1.5" />
                      Lanjutkan Pengerjaan Ujian
                    </Link>
                  ) : (
                    <Link
                      to={`/student/exams/${exam.id}/take`}
                      className="w-full flex items-center justify-center py-2.5 px-4 bg-royal-600 text-white font-semibold text-xs rounded-xl hover:bg-royal-700 transition shadow-sm"
                    >
                      <PlayCircle className="w-4 h-4 mr-1.5" />
                      Mulai Kerjakan Ujian
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

