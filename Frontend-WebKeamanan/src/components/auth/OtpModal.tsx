import React, { useState, useEffect, useRef } from 'react';
import { ShieldCheck, Loader2, ArrowRight, RefreshCw, Mail } from 'lucide-react';

interface OtpModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeToken: string;
  emailMasked: string;
  initialExpirySeconds?: number;
  onSuccess: () => void;
  onVerify: (challengeToken: string, otp: string) => Promise<any>;
  onResend: (challengeToken: string) => Promise<{ challengeToken: string; emailMasked: string }>;
}

export const OtpModal: React.FC<OtpModalProps> = ({
  isOpen,
  onClose,
  challengeToken: initialToken,
  emailMasked: initialEmailMasked,
  initialExpirySeconds = 300,
  onSuccess,
  onVerify,
  onResend,
}) => {
  const [token, setToken] = useState(initialToken);
  const [emailMasked, setEmailMasked] = useState(initialEmailMasked);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(initialExpirySeconds);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Update internal states if props change
  useEffect(() => {
    setToken(initialToken);
    setEmailMasked(initialEmailMasked);
    setTimer(initialExpirySeconds);
    setDigits(['', '', '', '', '', '']);
    setErrorMessage(null);
  }, [initialToken, initialEmailMasked, initialExpirySeconds]);

  // Focus first input on mount
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRefs.current[0]?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || timer <= 0) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, timer]);

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned && value !== '') return;

    const newDigits = [...digits];
    newDigits[index] = cleaned.slice(-1); // Take single character
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if all 6 filled
    if (cleaned && index === 5 && newDigits.every((d) => d !== '')) {
      handleVerifyCode(newDigits.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newDigits = [...digits];
    for (let i = 0; i < pasted.length; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);

    if (pasted.length === 6) {
      handleVerifyCode(pasted);
    } else {
      inputRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
  };

  const handleVerifyCode = async (otpCode?: string) => {
    const code = otpCode || digits.join('');
    if (code.length !== 6) {
      setErrorMessage('Masukkan 6 digit angka OTP secara lengkap.');
      return;
    }

    if (timer <= 0) {
      setErrorMessage('Waktu OTP telah kedaluwarsa. Silakan klik tombol kirim ulang.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage(null);

    try {
      await onVerify(token, code);
      onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Kode OTP salah atau tidak valid.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    if (isResending) return;
    setIsResending(true);
    setErrorMessage(null);

    try {
      const res = await onResend(token);
      setToken(res.challengeToken);
      setEmailMasked(res.emailMasked);
      setTimer(300); // Reset to 5 min
      setDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setIsResending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-navy-950/70 backdrop-blur-md" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl p-6 sm:p-8 z-10 border border-slate-100 text-center">
        {/* Shield Icon Header */}
        <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-navy-900 to-royal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-royal-600/20 text-white">
          <ShieldCheck className="w-9 h-9" />
        </div>

        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          Verifikasi MFA Administrator
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Demi alasan keamanan tingkat tinggi, kode OTP 6 digit telah dikirimkan ke email terdaftar:
        </p>

        <div className="inline-flex items-center space-x-2 mt-2 px-3 py-1 bg-royal-50 border border-royal-200 rounded-full text-royal-800 text-xs font-semibold">
          <Mail className="w-3.5 h-3.5 text-royal-600" />
          <span>{emailMasked || 'admin@examcenter.internal'}</span>
        </div>

        {/* Digit Inputs */}
        <div className="flex justify-center gap-2 sm:gap-3 my-6" onPaste={handlePaste}>
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              className="w-12 h-14 sm:w-13 sm:h-16 text-center text-2xl font-bold text-navy-900 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-royal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-royal-100 transition-all shadow-sm"
              autoComplete="off"
            />
          ))}
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs font-medium text-left">
            {errorMessage}
          </div>
        )}

        {/* Timer & Resend */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-6 px-1">
          <span className="flex items-center font-medium">
            ⏱ Masa berlaku:{' '}
            <strong className={`ml-1 font-semibold ${timer < 60 ? 'text-rose-600' : 'text-slate-800'}`}>
              {formatTimer(timer)}
            </strong>
          </span>

          <button
            type="button"
            onClick={handleResendOtp}
            disabled={isResending}
            className="flex items-center text-royal-600 hover:text-royal-800 font-semibold disabled:opacity-50 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${isResending ? 'animate-spin' : ''}`} />
            Kirim Ulang
          </button>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => handleVerifyCode()}
            disabled={isVerifying || digits.some((d) => d === '')}
            className="w-full flex items-center justify-center py-3.5 px-4 bg-gradient-to-r from-navy-900 via-royal-700 to-royal-600 text-white font-semibold rounded-xl hover:opacity-95 disabled:opacity-50 transition shadow-lg shadow-royal-600/25 text-sm"
          >
            {isVerifying ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Memverifikasi OTP...
              </>
            ) : (
              <>
                Konfirmasi Masuk Admin
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 text-xs font-medium text-slate-400 hover:text-slate-600 transition"
          >
            Batalkan & Kembali
          </button>
        </div>
      </div>
    </div>
  );
};

