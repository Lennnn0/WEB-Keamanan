import React, { useState } from 'react';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { Badge } from '../../components/common/Badge';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Loader2,
  ArrowRight,
  Info,
} from 'lucide-react';

export const ImportQuestionsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  // Preview result from backend
  const [previewData, setPreviewData] = useState<{
    summary: { totalRows: number; validCount: number; invalidCount: number };
    validRows: any[];
    invalidRows: any[];
    fileName: string;
  } | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewData(null);
    }
  };

  const handleUploadAndPreview = async () => {
    if (!selectedFile) {
      toastError('Silakan pilih file CSV atau Excel terlebih dahulu.');
      return;
    }

    setIsPreviewing(true);
    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await apiClient.post('/import/preview', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setPreviewData({
          summary: res.data.summary,
          validRows: res.data.validRows,
          invalidRows: res.data.invalidRows,
          fileName: res.data.fileName,
        });
        toastSuccess(`Pratinjau berhasil: ${res.data.summary.validCount} butir soal valid.`);
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal memproses file. Periksa format kolom Anda.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleCommitImport = async () => {
    if (!previewData || previewData.validRows.length === 0) {
      toastError('Tidak ada butir soal valid yang dapat diimpor.');
      return;
    }

    setIsCommitting(true);
    try {
      const res = await apiClient.post('/import/commit', {
        questions: previewData.validRows,
      });

      if (res.data.success) {
        toastSuccess(`Berhasil mengimpor ${res.data.insertedCount} butir soal ke Bank Soal!`);
        // Reset
        setSelectedFile(null);
        setPreviewData(null);
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan soal ke basis data.');
    } finally {
      setIsCommitting(false);
    }
  };

  const handleDownloadTemplate = (format: 'csv' | 'xlsx') => {
    window.open(`${apiClient.defaults.baseURL}/import/template?format=${format}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-navy-950 tracking-tight">
            Impor Soal Masal (CSV & XLSX)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Unggah berkas spreadsheet, validasi setiap baris dengan Zod, dan lakukan pratinjau sebelum menyimpan.
          </p>
        </div>

        {/* Template Download Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDownloadTemplate('csv')}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition shadow-subtle"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-royal-600" />
            Template CSV
          </button>
          <button
            onClick={() => handleDownloadTemplate('xlsx')}
            className="inline-flex items-center px-3.5 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition shadow-subtle"
          >
            <Download className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
            Template XLSX
          </button>
        </div>
      </div>

      {/* Info Warning */}
      <div className="p-4 bg-royal-50 border border-royal-200/80 rounded-xl flex items-start space-x-3 text-xs text-royal-900">
        <Info className="w-5 h-5 text-royal-600 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold">Ketentuan & Format Kolom Spreadsheet:</p>
          <p>
            Kolom Wajib: <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">question</code>,{' '}
            <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">option_a</code>,{' '}
            <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">option_b</code>,{' '}
            <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">option_c</code>,{' '}
            <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">option_d</code>,{' '}
            <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">correct_answer</code> (A/B/C/D).
          </p>
          <p>
            Kolom Opsional: <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">subject</code>,{' '}
            <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">difficulty</code> (easy/medium/hard),{' '}
            <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">explanation</code>,{' '}
            <code className="font-mono bg-royal-100 px-1 py-0.5 rounded">points</code>.
          </p>
        </div>
      </div>

      {/* Upload Dropzone */}
      <div className="bg-white border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center hover:border-royal-500 transition-colors">
        <input
          type="file"
          id="fileUpload"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          className="hidden"
        />
        <label htmlFor="fileUpload" className="cursor-pointer flex flex-col items-center">
          <div className="w-16 h-16 bg-royal-50 rounded-2xl flex items-center justify-center text-royal-600 mb-4 shadow-sm">
            <UploadCloud className="w-8 h-8" />
          </div>
          <span className="text-base font-bold text-slate-800">
            {selectedFile ? selectedFile.name : 'Klik untuk memilih file CSV atau Excel'}
          </span>
          <span className="text-xs text-slate-400 mt-1">
            Format yang didukung: .csv, .xlsx, .xls (Maksimal 5MB)
          </span>
        </label>

        {selectedFile && (
          <div className="mt-6 flex justify-center items-center gap-3">
            <button
              onClick={handleUploadAndPreview}
              disabled={isPreviewing}
              className="inline-flex items-center px-5 py-2.5 bg-royal-600 text-white font-semibold text-sm rounded-xl hover:bg-royal-700 disabled:opacity-50 transition shadow-sm"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menganalisis Format File...
                </>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Proses & Pratinjau Soal
                </>
              )}
            </button>
            <button
              onClick={() => {
                setSelectedFile(null);
                setPreviewData(null);
              }}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-50 transition"
            >
              Hapus Pilihan
            </button>
          </div>
        )}
      </div>

      {/* Preview Section */}
      {previewData && (
        <div className="space-y-6 pt-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-subtle">
              <span className="text-xs font-bold text-slate-400 uppercase">Total Baris Terbaca</span>
              <div className="text-2xl font-extrabold text-navy-950 mt-1">
                {previewData.summary.totalRows}
              </div>
            </div>

            <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-700 uppercase">Baris Valid (Siap Impor)</span>
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-2xl font-extrabold text-emerald-800 mt-1">
                {previewData.summary.validCount}
              </div>
            </div>

            <div className="bg-rose-50/50 p-5 rounded-xl border border-rose-200/80 shadow-subtle">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 uppercase">Baris Bermasalah</span>
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div className="text-2xl font-extrabold text-rose-800 mt-1">
                {previewData.summary.invalidCount}
              </div>
            </div>
          </div>

          {/* Invalid Rows Table if any */}
          {previewData.invalidRows.length > 0 && (
            <div className="bg-rose-50/30 border border-rose-200 rounded-2xl p-5 shadow-subtle">
              <div className="flex items-center space-x-2 text-rose-800 font-bold text-sm mb-3">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                <span>Daftar Kesalahan Baris yang Ditemukan (Harap perbaiki sebelum diimpor):</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-rose-200 text-rose-900 font-bold uppercase text-[10px]">
                      <th className="py-2 px-3">Nomor Baris</th>
                      <th className="py-2 px-3">Deskripsi Kesalahan Format</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rose-100 font-medium text-rose-700">
                    {previewData.invalidRows.map((inv, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold text-rose-900 whitespace-nowrap">
                          Baris #{inv.rowNumber}
                        </td>
                        <td className="py-2.5 px-3">
                          <ul className="list-disc list-inside space-y-0.5">
                            {inv.errors.map((errStr: string, eIdx: number) => (
                              <li key={eIdx}>{errStr}</li>
                            ))}
                          </ul>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Valid Questions Preview Table */}
          {previewData.validRows.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle overflow-hidden">
              <div className="p-4 bg-slate-50 border-b border-slate-200/80 flex items-center justify-between">
                <div className="text-sm font-bold text-slate-800">
                  Pratinjau {previewData.validRows.length} Soal yang Memenuhi Syarat
                </div>
                <Badge variant="success">Format Valid</Badge>
              </div>

              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 sticky top-0">
                    <tr className="text-[10px] font-bold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">No.</th>
                      <th className="py-2.5 px-3">Pertanyaan</th>
                      <th className="py-2.5 px-3">Opsi Jawaban</th>
                      <th className="py-2.5 px-3 text-center">Kunci</th>
                      <th className="py-2.5 px-3 text-center">Mapel</th>
                      <th className="py-2.5 px-3 text-center">Poin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {previewData.validRows.map((q, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-400">
                          {q.rowNumber || idx + 1}
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 max-w-xs truncate">
                          {q.question}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs text-[11px] truncate">
                          A: {q.option_a} | B: {q.option_b} | C: {q.option_c} | D: {q.option_d}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold text-royal-700">
                          {q.correct_answer}
                        </td>
                        <td className="py-2.5 px-3 text-center">{q.subject || 'Umum'}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{q.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Commit Action Bar */}
              <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Data yang diimpor akan langsung disimpan secara transaksi atomik ke Bank Soal.
                </div>
                <button
                  onClick={handleCommitImport}
                  disabled={isCommitting}
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-sm rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-md shadow-emerald-600/20"
                >
                  {isCommitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Menyimpan ke Basis Data...
                    </>
                  ) : (
                    <>
                      Konfirmasi & Simpan ke Bank Soal
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

