import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { useToast } from '../../components/common/Toast';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { Modal } from '../../components/common/Modal';
import {
  Clock,
  Shield,
  Flag,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Send,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileText,
} from 'lucide-react';

export const ExamTakingPage: React.FC = () => {
  const { id: examId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError, warning: toastWarning } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [attemptId, setAttemptId] = useState<string>('');
  const [exam, setExam] = useState<any>(null);
  const [questions, setQuestions] = useState<any[]>([]);

  // Navigation & Answers State
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({}); // { questionId: 'A' | 'B' | 'C' | 'D' }
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<string>>(new Set());
  const [savingStatus, setSavingStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Timer State
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Submit Confirmation Modal
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize Exam Session
  useEffect(() => {
    const startOrResumeExam = async () => {
      setIsLoading(true);
      try {
        const res = await apiClient.post(`/exams/${examId}/start`);
        if (res.data.success) {
          const data = res.data;
          setAttemptId(data.attemptId);
          setExam(data.exam);
          setQuestions(data.questions || []);

          // Prepopulate existing answers
          const savedAnswersMap: Record<string, string> = {};
          (data.questions || []).forEach((q: any) => {
            if (q.savedAnswer) {
              savedAnswersMap[q.id] = q.savedAnswer;
            }
          });
          setAnswers(savedAnswersMap);

          // Calculate remaining timer from startedAt + durationMinutes
          const startTimeMs = new Date(data.startedAt).getTime();
          const durationMs = data.durationMinutes * 60 * 1000;
          const endTimeMs = startTimeMs + durationMs;
          const nowMs = Date.now();
          const remainingSeconds = Math.max(0, Math.floor((endTimeMs - nowMs) / 1000));

          setTimeLeft(remainingSeconds);
        }
      } catch (err: any) {
        toastError(err.message || 'Gagal memulai sesi ujian.');
        if (err.data?.attemptId) {
          navigate(`/student/results/${err.data.attemptId}`);
        } else {
          navigate('/student/exams');
        }
      } finally {
        setIsLoading(false);
      }
    };

    startOrResumeExam();
  }, [examId]);

  // Live Timer Countdown
  useEffect(() => {
    if (timeLeft <= 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleAutoSubmitOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSelectOption = async (optionKey: string) => {
    const currentQ = questions[currentIndex];
    if (!currentQ || !attemptId) return;

    // Local optimistic update
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: optionKey,
    }));

    // Auto-save to backend
    setSavingStatus('saving');
    try {
      await apiClient.post(`/exams/attempts/${attemptId}/save-answer`, {
        questionId: currentQ.id,
        selectedOption: optionKey,
      });
      setSavingStatus('saved');
      setTimeout(() => setSavingStatus('idle'), 1500);
    } catch (err) {
      console.error('Failed to auto-save answer:', err);
      setSavingStatus('idle');
    }
  };

  const handleClearOption = async () => {
    const currentQ = questions[currentIndex];
    if (!currentQ || !attemptId) return;

    setAnswers((prev) => {
      const copy = { ...prev };
      delete copy[currentQ.id];
      return copy;
    });

    try {
      await apiClient.post(`/exams/attempts/${attemptId}/save-answer`, {
        questionId: currentQ.id,
        selectedOption: null,
      });
    } catch (err) {
      console.error('Failed to clear answer:', err);
    }
  };

  const handleToggleFlag = () => {
    const currentQ = questions[currentIndex];
    if (!currentQ) return;

    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(currentQ.id)) {
        next.delete(currentQ.id);
      } else {
        next.add(currentQ.id);
      }
      return next;
    });
  };

  const handleAutoSubmitOnTimeout = async () => {
    toastWarning('Waktu ujian telah habis! Sistem mengumpulkan lembar jawaban Anda secara otomatis.');
    await handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    if (!attemptId) return;
    setIsSubmitting(true);

    try {
      const res = await apiClient.post(`/exams/attempts/${attemptId}/submit`);
      if (res.data.success) {
        toastSuccess('Ujian berhasil diserahkan dan dinilai oleh sistem.');
        navigate(`/student/results/${attemptId}`);
      }
    } catch (err: any) {
      toastError(err.message || 'Gagal menyerahkan lembar ujian.');
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message="Menyiapkan lembar soal ujian terenkripsi..." fullScreen />;
  }

  const currentQuestion = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalCount = questions.length;
  const unansweredCount = totalCount - answeredCount;
  const isTimeCritical = timeLeft < 300; // < 5 minutes

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans select-none">
      {/* Top Floating Exam Header */}
      <header className="sticky top-0 z-30 bg-navy-950 text-white shadow-md border-b border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-royal-600 flex items-center justify-center font-bold text-sm">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold truncate max-w-xs sm:max-w-md">{exam?.title}</h1>
              <span className="text-[11px] text-slate-300">
                Passing Score: {exam?.passingScore}% • Total: {totalCount} Soal
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Autosave Status */}
            <div className="hidden sm:flex items-center text-xs text-slate-300">
              {savingStatus === 'saving' && (
                <span className="flex items-center text-amber-400">
                  <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                  Menyimpan...
                </span>
              )}
              {savingStatus === 'saved' && (
                <span className="flex items-center text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                  Jawaban tersimpan
                </span>
              )}
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl font-mono text-sm font-bold tracking-wider transition ${
                isTimeCritical
                  ? 'bg-rose-600 text-white animate-pulse'
                  : 'bg-navy-900 border border-navy-700 text-royal-300'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>{formatTimer(timeLeft)}</span>
            </div>

            {/* Finish Button */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-700 hover:opacity-95 text-white font-bold text-xs rounded-xl transition shadow-sm"
            >
              Selesai Ujian
            </button>
          </div>
        </div>
      </header>

      {/* Main Examination Workspace */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Pane: Question Sheet (Col Span 3) */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-6 sm:p-8 flex flex-col justify-between">
          <div>
            {/* Question Header */}
            <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold uppercase tracking-wider text-royal-600 bg-royal-50 px-2.5 py-1 rounded-md">
                  Soal No. {currentIndex + 1}
                </span>
                <span className="text-xs font-medium text-slate-400">dari {totalCount} butir</span>
              </div>

              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
                  Bobot: {currentQuestion?.points || 1} Poin
                </span>
                <button
                  onClick={handleToggleFlag}
                  className={`flex items-center space-x-1 px-3 py-1 text-xs font-semibold rounded-lg transition ${
                    flaggedQuestions.has(currentQuestion?.id)
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Flag className="w-3.5 h-3.5" />
                  <span>
                    {flaggedQuestions.has(currentQuestion?.id) ? 'Ditandai Ragu-ragu' : 'Tandai Ragu-ragu'}
                  </span>
                </button>
              </div>
            </div>

            {/* Question Text */}
            <div className="text-base sm:text-lg font-semibold text-slate-900 leading-relaxed mb-8">
              {currentQuestion?.questionText}
            </div>

            {/* Options List */}
            <div className="space-y-3">
              {[
                { key: 'A', text: currentQuestion?.optionA },
                { key: 'B', text: currentQuestion?.optionB },
                { key: 'C', text: currentQuestion?.optionC },
                { key: 'D', text: currentQuestion?.optionD },
              ].map(({ key, text }) => {
                const isSelected = answers[currentQuestion?.id] === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handleSelectOption(key)}
                    className={`w-full p-4 rounded-xl text-left text-sm flex items-start space-x-3.5 transition border-2 ${
                      isSelected
                        ? 'bg-royal-50/70 border-royal-600 text-royal-950 font-semibold shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs flex-shrink-0 transition ${
                        isSelected
                          ? 'bg-royal-600 text-white'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {key}
                    </span>
                    <span className="pt-1 leading-normal">{text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="pt-6 mt-8 border-t border-slate-100 flex items-center justify-between">
            <button
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 transition"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Soal Sebelumnya
            </button>

            {answers[currentQuestion?.id] && (
              <button
                onClick={handleClearOption}
                className="text-xs font-medium text-slate-400 hover:text-slate-600 flex items-center"
              >
                <RotateCcw className="w-3.5 h-3.5 mr-1" />
                Kosongkan Jawaban
              </button>
            )}

            <button
              onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
              disabled={currentIndex === totalCount - 1}
              className="inline-flex items-center px-4 py-2 bg-royal-600 text-white rounded-xl text-xs font-semibold hover:bg-royal-700 disabled:opacity-40 transition shadow-sm"
            >
              Soal Selanjutnya
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>

        {/* Right Pane: Question Navigator (Col Span 1) */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-subtle p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Navigasi Soal
              </h3>
              <span className="text-xs font-semibold text-royal-600">
                {answeredCount}/{totalCount} Terjawab
              </span>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-3 gap-1 mb-4 text-[10px] text-slate-500 font-semibold border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-royal-600" />
                <span>Dijawab</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-amber-400" />
                <span>Ragu</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-3 h-3 rounded-full bg-slate-200" />
                <span>Belum</span>
              </div>
            </div>

            {/* Numbers Matrix */}
            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = flaggedQuestions.has(q.id);
                const isCurrent = idx === currentIndex;

                let stateClasses = 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100';
                if (isFlagged) {
                  stateClasses = 'bg-amber-400 text-amber-950 font-bold border-amber-500';
                } else if (isAnswered) {
                  stateClasses = 'bg-royal-600 text-white font-bold border-royal-700';
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-9 rounded-lg text-xs font-semibold flex items-center justify-center transition border ${stateClasses} ${
                      isCurrent ? 'ring-2 ring-offset-2 ring-royal-600' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Complete Exam Action */}
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="w-full mt-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs rounded-xl hover:opacity-95 transition shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2"
            >
              <Send className="w-4 h-4" />
              <span>Selesaikan & Kumpulkan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal Before Final Submit */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="Konfirmasi Penyerahan Ujian"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Apakah Anda yakin ingin menyelesaikan dan mengumpulkan lembar jawaban ujian ini? Setelah diserahkan, pengerjaan akan dikunci permanen.
          </p>

          <div className="p-4 bg-slate-50 rounded-xl space-y-2 text-xs">
            <div className="flex justify-between font-medium text-slate-700">
              <span>Total Butir Soal:</span>
              <strong className="text-slate-900">{totalCount} Butir</strong>
            </div>
            <div className="flex justify-between font-medium text-emerald-700">
              <span>Soal Telah Terjawab:</span>
              <strong>{answeredCount} Butir</strong>
            </div>
            {unansweredCount > 0 && (
              <div className="flex justify-between font-medium text-rose-700">
                <span>Soal Belum Dijawab:</span>
                <strong>{unansweredCount} Butir</strong>
              </div>
            )}
          </div>

          {unansweredCount > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center space-x-2 text-xs text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
              <span>
                Peringatan: Masih terdapat {unansweredCount} butir soal yang belum Anda jawab.
              </span>
            </div>
          )}

          <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100">
            <button
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Kembali Memeriksa
            </button>
            <button
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center px-5 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-sm"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Mengirimkan Lembar Ujian...
                </>
              ) : (
                'Kumpulkan Sekarang'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

