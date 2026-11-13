import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FileText,
  Plus,
  Trash2,
  ExternalLink,
  BookOpen,
  FileCheck,
} from 'lucide-react';

export const StudyMaterialsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [materials, setMaterials] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [contentType, setContentType] = useState('application/pdf');

  const fetchMaterials = async () => {
    setIsLoading(true);
    try {
      const [matRes, subjRes] = await Promise.all([
        apiClient.get('/materials'),
        apiClient.get('/questions/subjects'),
      ]);
      if (matRes.data.success) setMaterials(matRes.data.materials || []);
      if (subjRes.data.success) setSubjects(subjRes.data.subjects || []);
    } catch (err: any) {
      toastError(err.message || 'Gagal memuat materi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  const handleSaveMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/materials', {
        title,
        description,
        subjectId: subjectId || null,
        fileUrl,
        fileName: fileName || `${title.toLowerCase().replace(/\s+/g, '-')}.pdf`,
        contentType,
      });
      toastSuccess('Materi pembelajaran berhasil ditambahkan!');
      setIsModalOpen(false);
      setTitle('');
      setDescription('');
      setFileUrl('');
      setFileName('');
      fetchMaterials();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan materi.');
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    try {
      await apiClient.delete(`/materials/${id}`);
      toastSuccess('Materi pembelajaran berhasil dihapus.');
      fetchMaterials();
    } catch (err: any) {
      toastError(err.message || 'Gagal menghapus materi.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">Materi Pembelajaran</h1>
          <p className="text-sm text-slate-500 mt-1">
            Unggah modul PDF, bahan ajar, dan referensi bacaan untuk siswa sebelum menghadapi ujian.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-royal-600 text-white rounded-xl font-semibold text-sm hover:bg-royal-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Unggah Materi Baru
        </button>
      </div>

      {isLoading ? (
        <LoadingSpinner message="Memuat daftar materi ajar..." />
      ) : materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum Ada Materi Pembelajaran"
          description="Anda belum mengunggah dokumen atau modul bahan ajar."
          action={{
            label: 'Unggah Materi Pertama',
            onClick: () => setIsModalOpen(true),
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5 hover:shadow-premium transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-royal-600 bg-royal-50 px-2.5 py-1 rounded-full">
                    {item.subjects?.name || 'Umum'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-xl flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{item.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {item.description || 'Modul dokumen pembelajaran terlampir.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <a
                  href={item.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-xs font-semibold text-royal-600 hover:text-royal-800 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Buka Dokumen
                </a>

                <button
                  onClick={() => handleDeleteMaterial(item.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                  title="Hapus Materi"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Unggah Materi Belajar Baru"
      >
        <form onSubmit={handleSaveMaterial} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Judul Materi
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Contoh: Modul Kriptografi & Hashing SHA-256"
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
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              URL Berkas / Dokumen PDF
            </label>
            <input
              type="url"
              required
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://storage.example.com/modul-keamanan.pdf"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Deskripsi Singkat
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Rangkuman materi atau petunjuk membaca..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-royal-600 focus:outline-none"
            />
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
              Simpan Materi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

