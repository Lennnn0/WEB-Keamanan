import { Request, Response, NextFunction } from 'express';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

export const createRateLimiter = (options: {
  windowMs: number; // e.g. 5 * 60 * 1000 (5 minutes)
  maxRequests: number; // e.g. 10
  message?: string;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown-client';
    const key = `${req.baseUrl}${req.path}_${ip}`;
    const now = Date.now();

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + options.windowMs,
      });
      next();
      return;
    }

    if (record.count >= options.maxRequests) {
      const waitSeconds = Math.ceil((record.resetTime - now) / 1000);
      res.status(429).json({
        success: false,
        message:
          options.message ||
          `Terlalu banyak percobaan. Silakan coba lagi dalam ${waitSeconds} detik demi alasan keamanan.`,
        retryAfter: waitSeconds,
      });
      return;
    }

    record.count += 1;
    next();
  };
};

export const authRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000, // 5 minutes
  maxRequests: 10,
  message: 'Batas percobaan login tercapai. Silakan coba kembali beberapa saat lagi.',
});

export const otpRateLimiter = createRateLimiter({
  windowMs: 5 * 60 * 1000,
  maxRequests: 6,
  message: 'Batas percobaan verifikasi OTP tercapai untuk sementara waktu.',
});

