import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Calendar,
  Plus,
  Clock,
  BookOpen,
  Trash2,
  CheckCircle2,
} from 'lucide-react';

export const SchedulesPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [schedules, setSchedules] = useState<any[]>([]);
  const [exams, setExams] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [examId, setExamId] = useState('');
  const [title, setTitle] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');

  const fetchSchedulesAndExams = async () => {
    setIsLoading(true);
    try {
      const [schedRes, examRes] = await Promise.all([
        apiClient.get('/schedules'),
        apiClient.get('/exams/admin/all'),
      ]);
      if (schedRes.data.success) setSchedules(schedRes.data.schedules || []);
      if (examRes.data.success) setExams(examRes.data.exams || []);
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat jadwal ujian.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedulesAndExams();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.post('/schedules', {
        examId,
        title,
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
      });
      toastSuccess('Jadwal ujian berhasil ditambahkan!');
      setIsModalOpen(false);
      setTitle('');
      setExamId('');
      setStartTime('');
      setEndTime('');
      fetchSchedulesAndExams();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan jadwal.');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await apiClient.patch(`/schedules/${id}/status`, { status: newStatus });
      toastSuccess('Status jadwal berhasil diperbarui.');
      fetchSchedulesAndExams();
    } catch (err: any) {
      toastError(err.message || 'Gagal memperbarui status.');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    try {
      await apiClient.delete(`/schedules/${id}`);
      toastSuccess('Jadwal berhasil dihapus.');
      fetchSchedulesAndExams();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus jadwal.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">Jadwal Sesi Ujian</h1>
          <p className="text-sm text-slate-500 mt-1">
            Atur rentang kalender waktu aktif pembukaan dan penutupan gerbang pengerjaan ujian.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-royal-600 text-white rounded-xl font-semibold text-sm hover:bg-royal-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Atur Jadwal Baru
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Memuat kalender jadwal..." />
      ) : schedules.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="Belum Ada Jadwal Ujian Aktif"
          description="Anda belum menjadwalkan sesi pembukaan ujian bagi siswa."
          action={{
            label: 'Buat Jadwal Pertama',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {schedules.map((sch) => (
            <div
              key={sch.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5 hover:shadow-premium transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-royal-600 bg-royal-50 px-2.5 py-1 rounded-full">
                    {sch.exams?.subjects?.name || 'Umum'}
                  </span>
                  <Badge
                    variant={
                      sch.status === 'active'
                        ? 'success'
                        : sch.status === 'completed'
                        ? 'gray'
                        : sch.status === 'cancelled'
                        ? 'danger'
                        : 'warning'
                    }
                  >
                    {sch.status}
                  </Badge>
                </div>

                <h3 className="text-sm font-bold text-slate-900">{sch.title}</h3>
                <p className="text-xs text-slate-500 mt-0.5">Ujian: {sch.exams?.title}</p>

                <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-royal-600 flex-shrink-0" />
                    <span>Mulai: {new Date(sch.start_time).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-3.5 h-3.5 text-rose-500 flex-shrink-0" />
                    <span>Selesai: {new Date(sch.end_time).toLocaleString('id-ID')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <select
                  value={sch.status}
                  onChange={(e) => handleStatusChange(sch.id, e.target.value)}
                  className="text-xs font-semibold px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-700"
                >
                  <option value="scheduled">Scheduled</option>
                  <option value="active">Active</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  onClick={() => handleDeleteSchedule(sch.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Schedule Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Jadwalkan Sesi Ujian Baru"
      >
        <form onSubmit={handleCreateSchedule} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Pilih Paket Ujian
            </label>
            <select
              required
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
            >
              <option value="">Pilih Paket Ujian...</option>
              {exams.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  {ex.title} ({ex.duration_minutes} Menit)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Label / Judul Jadwal
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Sesi 1 - Kelas TI Pagi"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Waktu Mulai
              </label>
              <input
                type="datetime-local"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Waktu Selesai
              </label>
              <input
                type="datetime-local"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-royal-600 text-white rounded-lg text-sm font-semibold hover:bg-royal-700 shadow-sm"
            >
              Simpan Jadwal
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

