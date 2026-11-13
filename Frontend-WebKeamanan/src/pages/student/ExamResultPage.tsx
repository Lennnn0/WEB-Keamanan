import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Badge } from '../../components/common/Badge';
import {
  Award,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  BookOpen,
  Calendar,
} from 'lucide-react';

export const ExamResultPage: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { error: toastError } = useToast();

  const [attempt, setAttempt] = useState<any>(null);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResult = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.get(`/exams/attempts/${attemptId}/result`);
        if (res.data.success) {
          setAttempt(res.data.attempt);
          setAnswers(res.data.answers || []);

          // Trigger confetti if passed
          if (res.data.attempt?.is_passed) {
            try {
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
              });
            } catch (e) {
              // ignore confetti failure in headless/test
            }
          }
        }
      } catch (err: any) {
        toastError(err.message || 'Gagal memuat hasil ujian.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchResult();
  }, [attemptId]);

  if (isLoading) {
    return <LoadingSpinner message="Mengunduh lembar evaluasi dan penilaian..." />;
  }

  if (!attempt) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-500">Hasil evaluasi tidak ditemukan.</p>
        <Link to="/student" className="mt-4 inline-block text-royal-600 font-bold text-sm">
          Kembali ke Dashboard
        </Link>
      </div>
    );
  }

  const isPassed = attempt.is_passed;
  const percentage = attempt.percentage;
  const passingScore = attempt.exams?.passing_score || 70;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Return Button */}
      <div>
        <Link
          to="/student/exams"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-royal-600 transition"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          Kembali ke Daftar Ujian
        </Link>
      </div>

      {/* Primary Score Hero Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-premium p-6 sm:p-10 text-center relative overflow-hidden">
        <div className="relative z-10">
          <div
            className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-white mb-4 shadow-lg ${
              isPassed
                ? 'bg-gradient-to-tr from-emerald-600 to-teal-500 shadow-emerald-500/30'
                : 'bg-gradient-to-tr from-rose-600 to-red-500 shadow-rose-500/30'
            }`}
          >
            {isPassed ? <Award className="w-10 h-10" /> : <XCircle className="w-10 h-10" />}
          </div>

          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold mb-3 border">
            {isPassed ? (
              <span className="text-emerald-700 bg-emerald-50 border-emerald-200 px-3 py-0.5 rounded-full">
                SELAMAT! ANDA LULUS UJIAN
              </span>
            ) : (
              <span className="text-rose-700 bg-rose-50 border-rose-200 px-3 py-0.5 rounded-full">
                BELUM MEMENUHI NILAI KELULUSAN
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-950 tracking-tight">
            {attempt.exams?.title}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mata Pelajaran: {attempt.exams?.subjects?.name || 'Umum'}
          </p>

          {/* Big Score Display */}
          <div className="my-8">
            <div className="text-6xl sm:text-7xl font-extrabold text-navy-950 tracking-tight">
              {percentage}%
            </div>
            <div className="text-sm font-semibold text-slate-500 mt-2">
              Total Skor: <strong>{attempt.total_score}</strong> dari maksimal{' '}
              <strong>{attempt.max_score} Poin</strong> (KKM: {passingScore}%)
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 flex flex-wrap justify-center gap-6 text-xs text-slate-500">
            <div>
              <span className="block font-bold text-slate-700">Waktu Penyerahan:</span>
              <span>{new Date(attempt.submitted_at || attempt.created_at).toLocaleString('id-ID')}</span>
            </div>
            <div>
              <span className="block font-bold text-slate-700">Status Validasi:</span>
              <span className="text-emerald-600 font-semibold">Tervalidasi & Terkunci Backend</span>
            </div>
          </div>
        </div>
      </div>

      {/* Question Review Breakdown */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-navy-950">
            Pembahasan & Tinjauan Butir Soal ({answers.length} Butir)
          </h2>
          <span className="text-xs text-slate-400">Kunci jawaban resmi dari server</span>
        </div>

        <div className="space-y-4">
          {answers.map((item, idx) => {
            const q = item.questions;
            const isCorrect = item.is_correct;
            const chosen = item.selected_option;
            const trueCorrect = q.correct_answer;

            return (
              <div
                key={item.question_id || idx}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase">
                    Soal No. {idx + 1}
                  </span>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-slate-600">
                      Poin: {item.points_awarded} / {q.points || 1}
                    </span>
                    <Badge variant={isCorrect ? 'success' : 'danger'}>
                      {isCorrect ? 'Jawaban Benar' : 'Jawaban Salah'}
                    </Badge>
                  </div>
                </div>

                <div className="text-sm font-bold text-slate-900 leading-relaxed">
                  {q.question_text}
                </div>

                {/* Options display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {[
                    { key: 'A', text: q.option_a },
                    { key: 'B', text: q.option_b },
                    { key: 'C', text: q.option_c },
                    { key: 'D', text: q.option_d },
                  ].map(({ key, text }) => {
                    const isUserChoice = chosen === key;
                    const isKeyAnswer = trueCorrect === key;

                    let bgClass = 'bg-slate-50 border-slate-200 text-slate-700';
                    if (isKeyAnswer) {
                      bgClass = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold';
                    } else if (isUserChoice && !isCorrect) {
                      bgClass = 'bg-rose-50 border-rose-300 text-rose-900 font-bold';
                    }

                    return (
                      <div
                        key={key}
                        className={`p-3 rounded-xl border flex items-start space-x-2.5 ${bgClass}`}
                      >
                        <span className="font-extrabold">{key}.</span>
                        <span className="flex-1">{text}</span>
                        {isKeyAnswer && (
                          <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                            Kunci
                          </span>
                        )}
                        {isUserChoice && (
                          <span className="text-[10px] bg-slate-800 text-white px-1.5 py-0.5 rounded font-bold uppercase">
                            Pilihan Anda
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation */}
                {q.explanation && (
                  <div className="p-3.5 bg-royal-50/60 border border-royal-100 rounded-xl text-xs text-royal-950">
                    <strong className="block text-royal-800 font-bold mb-1">
                      💡 Pembahasan Jawaban:
                    </strong>
                    {q.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

