import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import {
  HelpCircle,
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [questions, setQuestions] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    subjectName: 'Keamanan Web & Jaringan',
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctAnswer: 'A',
    explanation: '',
    difficulty: 'medium',
    points: 1,
  });

  const fetchQuestions = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedSubject) params.append('subject', selectedSubject);
      if (selectedDifficulty) params.append('difficulty', selectedDifficulty);

      const res = await apiClient.get(`/questions?${params.toString()}`);
      if (res.data.success) {
        setQuestions(res.data.questions || []);
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat bank soal.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const res = await apiClient.get('/questions/subjects');
      if (res.data.success) {
        setSubjects(res.data.subjects || []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuestions();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedSubject, selectedDifficulty]);

  const handleOpenCreateModal = () => {
    setEditingQuestion(null);
    setFormData({
      subjectName: subjects[0]?.name || 'Keamanan Web & Jaringan',
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
      explanation: '',
      difficulty: 'medium',
      points: 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (q: any) => {
    setEditingQuestion(q);
    setFormData({
      subjectName: q.subject_name || 'Umum',
      questionText: q.question_text || '',
      optionA: q.option_a || '',
      optionB: q.option_b || '',
      optionC: q.option_c || '',
      optionD: q.option_d || '',
      correctAnswer: q.correct_answer || 'A',
      explanation: q.explanation || '',
      difficulty: q.difficulty || 'medium',
      points: Number(q.points) || 1,
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingQuestion) {
        // Update
        await apiClient.put(`/questions/${editingQuestion.id}`, formData);
        toastSuccess('Butir soal berhasil diperbarui!');
      } else {
        // Create
        await apiClient.post('/questions', formData);
        toastSuccess('Butir soal baru berhasil ditambahkan ke Bank Soal!');
      }
      setIsModalOpen(false);
      fetchQuestions();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan soal.');
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    try {
      await apiClient.delete(`/questions/${id}`);
      toastSuccess('Soal berhasil dihapus.');
      setDeleteConfirmId(null);
      fetchQuestions();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus soal.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">Bank Soal Evaluasi</h1>
          <p className="text-sm text-slate-500 mt-1">
            Kelola seluruh butir pertanyaan, opsi pilihan ganda, dan kunci jawaban berbobot.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-royal-600 text-white rounded-xl font-semibold text-sm hover:bg-royal-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Tambah Soal Manual
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-subtle flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari pertanyaan soal..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-royal-600 focus:bg-white transition"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-royal-600 focus:bg-white"
          >
            <option value="">Semua Mata Pelajaran</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>

          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:border-royal-600 focus:bg-white"
          >
            <option value="">Semua Tingkat</option>
            <option value="easy">Mudah (Easy)</option>
            <option value="medium">Sedang (Medium)</option>
            <option value="hard">Sulit (Hard)</option>
          </select>
        </div>
      </div>

      {/* Table Content */}
      {isLoading ? (
        <LoadingSpinner message="Memuat daftar pertanyaan..." />
      ) : questions.length === 0 ? (
        <EmptyState
          icon={HelpCircle}
          title="Bank Soal Masih Kosong"
          description="Belum ada butir pertanyaan yang sesuai dengan kriteria pencarian Anda. Anda dapat menambahkan soal manual atau mengimpor file Excel."
          action={{
            label: 'Tambah Soal Sekarang',
            onClick: handleOpenCreateModal,
          }}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Mata Pelajaran</th>
                  <th className="py-3.5 px-4 w-1/3">Pertanyaan</th>
                  <th className="py-3.5 px-4">Pilihan Jawaban</th>
                  <th className="py-3.5 px-4 text-center">Kunci</th>
                  <th className="py-3.5 px-4 text-center">Tingkat</th>
                  <th className="py-3.5 px-4 text-center">Poin</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {questions.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-700 whitespace-nowrap">
                      {q.subject_name || 'Umum'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-800 font-medium">
                      <p className="line-clamp-2">{q.question_text}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      <div className="space-y-0.5 text-[11px]">
                        <div className={q.correct_answer === 'A' ? 'font-bold text-royal-700' : ''}>
                          A: {q.option_a}
                        </div>
                        <div className={q.correct_answer === 'B' ? 'font-bold text-royal-700' : ''}>
                          B: {q.option_b}
                        </div>
                        <div className={q.correct_answer === 'C' ? 'font-bold text-royal-700' : ''}>
                          C: {q.option_c}
                        </div>
                        <div className={q.correct_answer === 'D' ? 'font-bold text-royal-700' : ''}>
                          D: {q.option_d}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge variant="primary">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        {q.correct_answer}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <Badge
                        variant={
                          q.difficulty === 'easy'
                            ? 'success'
                            : q.difficulty === 'hard'
                            ? 'danger'
                            : 'warning'
                        }
                      >
                        {q.difficulty}
                      </Badge>
                    </td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                      {q.points}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      <button
                        onClick={() => handleOpenEditModal(q)}
                        className="p-1.5 text-slate-400 hover:text-royal-600 hover:bg-royal-50 rounded-lg transition"
                        title="Edit Soal"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirmId(q.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title="Hapus Soal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingQuestion ? 'Edit Butir Soal' : 'Tambah Soal Baru ke Bank Soal'}
        maxWidth="2xl"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Mata Pelajaran
              </label>
              <input
                type="text"
                required
                value={formData.subjectName}
                onChange={(e) => setFormData({ ...formData, subjectName: e.target.value })}
                placeholder="Contoh: Keamanan Web & Jaringan"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tingkat
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
                >
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Poin / Bobot
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  required
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Teks Pertanyaan
            </label>
            <textarea
              required
              rows={3}
              value={formData.questionText}
              onChange={(e) => setFormData({ ...formData, questionText: e.target.value })}
              placeholder="Tuliskan butir soal pertanyaan di sini..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
            />
          </div>

          {/* Options A, B, C, D */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Pilihan Jawaban (Pilih Kunci Jawaban Benar)
            </label>

            {[
              { key: 'A', field: 'optionA' },
              { key: 'B', field: 'optionB' },
              { key: 'C', field: 'optionC' },
              { key: 'D', field: 'optionD' },
            ].map(({ key, field }) => (
              <div key={key} className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, correctAnswer: key })}
                  className={`w-9 h-9 rounded-lg font-bold text-sm flex items-center justify-center transition border ${
                    formData.correctAnswer === key
                      ? 'bg-royal-600 text-white border-royal-600 shadow-sm'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                  }`}
                  title={`Jadikan ${key} sebagai kunci jawaban`}
                >
                  {key}
                </button>
                <input
                  type="text"
                  required
                  value={(formData as any)[field]}
                  onChange={(e) => setFormData({ ...formData, [field]: e.target.value })}
                  placeholder={`Teks pilihan opsi ${key}...`}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Pembahasan / Penjelasan Jawaban (Opsional)
            </label>
            <textarea
              rows={2}
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              placeholder="Penjelasan ini hanya akan ditampilkan kepada siswa setelah ujian diserahkan..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-royal-600 text-white rounded-lg text-sm font-semibold hover:bg-royal-700 transition shadow-sm"
            >
              {editingQuestion ? 'Perbarui Soal' : 'Simpan ke Bank Soal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deleteConfirmId)}
        onClose={() => setDeleteConfirmId(null)}
        title="Konfirmasi Hapus Soal"
      >
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-amber-600">
            <AlertTriangle className="w-6 h-6 flex-shrink-0" />
            <p className="text-sm font-medium text-slate-700">
              Apakah Anda yakin ingin menghapus butir pertanyaan ini dari Bank Soal? Tindakan ini tidak dapat dibatalkan.
            </p>
          </div>
          <div className="flex justify-end space-x-2 pt-3">
            <button
              onClick={() => setDeleteConfirmId(null)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              Batal
            </button>
            <button
              onClick={() => deleteConfirmId && handleDeleteQuestion(deleteConfirmId)}
              className="px-4 py-2 bg-rose-600 text-white rounded-lg text-sm font-semibold hover:bg-rose-700"
            >
              Hapus Soal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

