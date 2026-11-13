import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/EmptyState';
import {
  FileText,
  ExternalLink,
  BookOpen,
  Download,
} from 'lucide-react';

export const StudentMaterialsPage: React.FC = () => {
  const { error: toastError } = useToast();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMaterials = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get('/materials');
        if (res.data.success) {
          setMaterials(res.data.materials || []);
        }
      } catch (err: any) {
        toastError(err.message || 'Gagal memuat bahan ajar.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMaterials();
  }, []);

  if (isLoading) {
    return <LoadingSpinner message="Menyiapkan perpustakaan modul belajar..." />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
          Pusat Materi & Bahan Ajar
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Unduh dan pelajari materi modul pembelajaran yang telah disediakan guru dan pengawas ujian.
        </p>
      </div>

      {materials.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Belum Ada Modul Ajar Tersedia"
          description="Pengajar belum mengunggah materi pelajaran ke portal. Silakan periksa kembali nanti."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {materials.map((mat) => (
            <div
              key={mat.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5 hover:shadow-premium transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-royal-600 bg-royal-50 px-2.5 py-1 rounded-full">
                    {mat.subjects?.name || 'Umum'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {new Date(mat.created_at).toLocaleDateString('id-ID')}
                  </span>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="p-3 bg-royal-50 text-royal-600 rounded-xl flex-shrink-0">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 line-clamp-1">{mat.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {mat.description || 'Modul dokumen pembelajaran terlampir.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                  {mat.file_name}
                </span>

                <a
                  href={mat.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-3 py-1.5 bg-royal-600 text-white text-xs font-semibold rounded-lg hover:bg-royal-700 transition shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" />
                  Buka Dokumen
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

