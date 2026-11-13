import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  BookMarked,
  Plus,
  Clock,
  Award,
  Globe,
  FileEdit,
  Trash2,
  CheckCircle,
  HelpCircle,
  Search,
  Users,
} from 'lucide-react';

export const ExamManagementPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [exams, setExams] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [bankQuestions, setBankQuestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [durationMinutes, setDurationMinutes] = useState(60);
  const [passingScore, setPassingScore] = useState(75);
  const [isPublished, setIsPublished] = useState(false);
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState<string[]>([]);

  // Question Picker Filter in modal
  const [questionSearch, setQuestionSearch] = useState('');

  const fetchExams = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/exams/admin/all');
      if (res.data.success) {
        setExams(res.data.exams || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat daftar ujian.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjectsAndQuestions = async () => {
    try {
      const [subjRes, qRes] = await Promise.all([
        apiClient.get('/questions/subjects'),
        apiClient.get('/questions?limit=100'),
      ]);
      if (subjRes.data.success) setSubjects(subjRes.data.subjects || []);
      if (qRes.data.success) setBankQuestions(qRes.data.questions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExams();
    fetchSubjectsAndQuestions();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingExamId(null);
    setTitle('');
    setDescription('');
    setSubjectId(subjects[0]?.id || '');
    setDurationMinutes(60);
    setPassingScore(75);
    setIsPublished(false);
    setShuffleQuestions(false);
    setSelectedQuestionIds([]);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (exam: any) => {
    setEditingExamId(exam.id);
    setTitle(exam.title);
    setDescription(exam.description || '');
    setSubjectId(exam.subject_id || '');
    setDurationMinutes(exam.duration_minutes);
    setPassingScore(exam.passing_score);
    setIsPublished(exam.is_published);
    setShuffleQuestions(exam.shuffle_questions);

    try {
      const detailRes = await apiClient.get(`/exams/${exam.id}`);
      if (detailRes.data.success && detailRes.data.exam) {
        const qIds = detailRes.data.exam.questions.map((q: any) => q.id);
        setSelectedQuestionIds(qIds);
      }
    } catch {
      setSelectedQuestionIds([]);
    }

    setIsModalOpen(true);
  };

  const handleTogglePublish = async (examId: string, currentStatus: boolean) => {
    try {
      const res = await apiClient.patch(`/exams/${examId}/publish`, {
        isPublished: !currentStatus,
      });
      toastSuccess(res.data.message || 'Status publikasi diperbarui.');
      fetchExams();
    } catch (err: any) {
      toastError(err.message || 'Gagal mengubah status publikasi.');
    }
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedQuestionIds.length === 0) {
      toastError('Pilih minimal satu butir pertanyaan dari bank soal.');
      return;
    }

    const payload = {
      title,
      description,
      subjectId: subjectId || null,
      durationMinutes: Number(durationMinutes),
      passingScore: Number(passingScore),
      isPublished,
      shuffleQuestions,
      questionIds: selectedQuestionIds,
    };

    try {
      if (editingExamId) {
        await apiClient.put(`/exams/${editingExamId}`, payload);
        toastSuccess('Paket ujian berhasil diperbarui.');
      } else {
        await apiClient.post('/exams', payload);
        toastSuccess('Paket ujian berhasil dibuat.');
      }
      setIsModalOpen(false);
      fetchExams();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan ujian.');
    }
  };

  const handleDeleteExam = async (id: string) => {
    try {
      await apiClient.delete(`/exams/${id}`);
      toastSuccess('Paket ujian berhasil dihapus.');
      setDeleteConfirmId(null);
      fetchExams();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus ujian.');
    }
  };

  const toggleSelectQuestion = (qId: string) => {
    if (selectedQuestionIds.includes(qId)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((id) => id !== qId));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, qId]);
    }
  };

  const filteredQuestions = bankQuestions.filter((q) =>
    q.question_text?.toLowerCase().includes(questionSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">Manajemen Paket Ujian</h1>
          <p className="text-sm text-slate-500 mt-1">
            Buat jadwal evaluasi, tautkan soal dari bank soal, dan atur status penerbitan (*publish*).
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-royal-600 text-white rounded-xl font-semibold text-sm hover:bg-royal-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Buat Ujian Baru
        </button>
      </div>

      {/* Exam Cards Grid */}
      {isLoading ? (
        <LoadingSpinner message="Memuat daftar paket ujian..." />
      ) : exams.length === 0 ? (
        <EmptyState
          icon={BookMarked}
          title="Belum Ada Paket Ujian"
          description="Anda belum menyusun paket ujian. Klik tombol di bawah untuk membuat ujian baru dari bank soal."
          action={{
            label: 'Buat Ujian Sekarang',
            onClick: handleOpenCreateModal,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => {
            const questionCount = exam.exam_questions?.[0]?.count || 0;
            const attemptCount = exam.exam_attempts?.[0]?.count || 0;

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
                    <Badge variant={exam.is_published ? 'success' : 'gray'}>
                      {exam.is_published ? 'Published' : 'Draf'}
                    </Badge>
                  </div>

                  <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{exam.title}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                    {exam.description || 'Tidak ada deskripsi ujian.'}
                  </p>

                  <div className="mt-5 grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Durasi</span>
                      <span className="font-bold text-slate-800">{exam.duration_minutes} Menit</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Passing Score</span>
                      <span className="font-bold text-slate-800">{exam.passing_score}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Jumlah Soal</span>
                      <span className="font-bold text-slate-800">{questionCount} Soal</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleTogglePublish(exam.id, exam.is_published)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition ${
                      exam.is_published
                        ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                  >
                    {exam.is_published ? 'Tarik Publikasi' : 'Publikasikan Ujian'}
                  </button>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEditModal(exam)}
                      className="p-1.5 text-slate-400 hover:text-royal-600 hover:bg-white rounded-lg transition"
                      title="Edit Ujian"
                    >
                      <FileEdit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(exam.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition"
                      title="Hapus Ujian"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Exam Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingExamId ? 'Edit Paket Ujian' : 'Buat Paket Ujian Baru'}
        maxWidth="3xl"
      >
        <form onSubmit={handleSaveExam} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Judul Ujian
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Ujian Tengah Semester - Keamanan Web"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mata Pelajaran
              </label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
              >
                <option value="">Pilih Mata Pelajaran...</option>
                {subjects.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Durasi (Menit)
                </label>
                <input
                  type="number"
                  min="5"
                  max="360"
                  required
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Passing Score (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={passingScore}
                  onChange={(e) => setPassingScore(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Deskripsi & Petunjuk Pengerjaan
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Petunjuk singkat sebelum siswa memulai ujian..."
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
              />
              <span>Publikasikan ujian langsung agar dapat diakses siswa</span>
            </label>

            <label className="flex items-center space-x-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={shuffleQuestions}
                onChange={(e) => setShuffleQuestions(e.target.checked)}
                className="rounded text-royal-600 focus:ring-royal-500 w-4 h-4"
              />
              <span>Acak urutan nomor soal untuk setiap siswa</span>
            </label>
          </div>

          {/* Question Selector from Question Bank */}
          <div className="pt-4 border-t border-slate-200 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase">
                  Pilih Butir Soal dari Bank Soal
                </span>
                <span className="text-xs text-royal-600 font-bold ml-2">
                  ({selectedQuestionIds.length} Soal Terpilih)
                </span>
              </div>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={questionSearch}
                  onChange={(e) => setQuestionSearch(e.target.value)}
                  placeholder="Cari soal..."
                  className="w-full pl-8 pr-3 py-1 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-royal-600"
                />
              </div>
            </div>

            <div className="max-h-56 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-slate-50">
              {filteredQuestions.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Tidak ada butir soal di Bank Soal. Tambah soal manual atau impor spreadsheet terlebih dahulu.
                </div>
              ) : (
                filteredQuestions.map((q) => {
                  const isChecked = selectedQuestionIds.includes(q.id);
                  return (
                    <div
                      key={q.id}
                      onClick={() => toggleSelectQuestion(q.id)}
                      className={`p-3 flex items-start space-x-3 cursor-pointer transition ${
                        isChecked ? 'bg-royal-50/80' : 'hover:bg-white'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        className="mt-1 rounded text-royal-600 focus:ring-royal-500 w-4 h-4 pointer-events-none"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-bold text-slate-700">{q.subject_name}</span>
                          <span className="text-[10px] text-slate-400">• Poin: {q.points}</span>
                        </div>
                        <p className="text-slate-800 line-clamp-2">{q.question_text}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
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
              {editingExamId ? 'Simpan Perubahan' : 'Buat Paket Ujian'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Konfirmasi Hapus Ujian"
      >
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700">
            Apakah Anda yakin ingin menghapus paket ujian ini? Seluruh data relasi soal ujian ini akan dihapus.
          </p>
          <div className="flex justify-end space-x-2 pt-2">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={() => deleteConfirmId && handleDeleteExam(deleteConfirmId)}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700"
            >
              Hapus Ujian
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

