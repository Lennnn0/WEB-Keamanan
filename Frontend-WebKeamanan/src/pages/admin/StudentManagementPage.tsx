import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  Search,
  BookOpen,
  Award,
  Eye,
  CheckCircle,
  XCircle,
} from 'lucide-react';

export const StudentManagementPage: React.FC = () => {
  const { error: toastError } = useToast();

  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Student details modal
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentAttempts, setStudentAttempts] = useState<any[]>([]);
  const [isDetailLoading, setIsDetailLoading] = useState(false);

  const fetchStudents = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/students?search=${encodeURIComponent(search)}`);
      if (res.data.success) {
        setStudents(res.data.students || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat data siswa.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleViewStudentDetails = async (student: any) => {
    setSelectedStudent(student);
    setIsDetailLoading(true);
    try {
      const res = await apiClient.get(`/students/${student.id}`);
      if (res.data.success) {
        setStudentAttempts(res.data.attempts || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat riwayat pengerjaan siswa.');
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">Manajemen Siswa</h1>
          <p className="text-sm text-slate-500 mt-1">
            Daftar peserta didik terdaftar, riwayat evaluasi yang telah diserahkan, dan statistik capaian nilai.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atau email siswa..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-royal-600 shadow-subtle"
          />
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Memuat direktori siswa..." />
      ) : students.length === 0 ? (
        <EmptyState
          icon={Users}
          title="Tidak Ada Siswa Ditemukan"
          description="Belum ada akun siswa yang terdaftar atau sesuai dengan kata kunci pencarian Anda."
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Nama Siswa</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4 text-center">Ujian Selesai</th>
                  <th className="py-3.5 px-4 text-center">Rata-Rata Nilai</th>
                  <th className="py-3.5 px-4 text-center">Kelulusan</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {students.map((st) => (
                  <tr key={st.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-royal-100 text-royal-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                        {st.full_name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <span>{st.full_name}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">{st.email}</td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-700">
                      {st.completedExams} Ujian
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-royal-700">
                      {st.averageScore}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant={st.passedExams > 0 ? 'success' : 'gray'}>
                        {st.passedExams} Lulus
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleViewStudentDetails(st)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 bg-royal-50 text-royal-700 hover:bg-royal-100 rounded-lg font-semibold transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Riwayat Ujian</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Student Details & Attempt History Modal */}
      <Modal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        title={`Riwayat Evaluasi: ${selectedStudent?.full_name || 'Siswa'}`}
        maxWidth="2xl"
      >
        {isDetailLoading ? (
          <LoadingSpinner message="Memuat lembar pengerjaan siswa..." />
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl flex items-center justify-between text-xs text-slate-600">
              <div>
                <span className="font-bold text-slate-800">Email Siswa:</span> {selectedStudent?.email}
              </div>
              <div>
                <span className="font-bold text-slate-800">Total Selesai:</span>{' '}
                {studentAttempts.filter((a) => a.status === 'submitted').length} Kali
              </div>
            </div>

            {studentAttempts.length === 0 ? (
              <div className="text-center py-8 text-xs text-slate-400">
                Siswa ini belum pernah memulai atau menyelesaikan ujian apa pun.
              </div>
            ) : (
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
                {studentAttempts.map((att) => (
                  <div key={att.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-800">{att.exams?.title}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Mulai: {new Date(att.started_at).toLocaleString('id-ID')}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 text-right">
                      <div>
                        <div className="font-extrabold text-sm text-navy-950">
                          {att.percentage !== null ? `${att.percentage}%` : '-'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Skor: {att.total_score} / {att.max_score}
                        </div>
                      </div>

                      <Badge variant={att.is_passed ? 'success' : 'danger'}>
                        {att.is_passed ? (
                          <>
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Lulus
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 mr-1" />
                            Tidak Lulus
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

