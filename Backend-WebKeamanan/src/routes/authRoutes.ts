import { Router } from 'express';
import {
  register,
  login,
  verifyOtp,
  resendOtpController,
  getMe,
  getMfaStatus,
  toggleMfa,
} from '../controllers/authController';
import { validate } from '../middlewares/validate';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  resendOtpSchema,
  toggleMfaSchema,
} from '../types';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/requireAdmin';
import { authRateLimiter, otpRateLimiter } from '../middlewares/rateLimiter';

const router = Router();

// Public Auth Endpoints
router.post('/register', authRateLimiter, validate(registerSchema), register);
router.post('/login', authRateLimiter, validate(loginSchema), login);
router.post('/verify-otp', otpRateLimiter, validate(verifyOtpSchema), verifyOtp);
router.post('/resend-otp', otpRateLimiter, validate(resendOtpSchema), resendOtpController);

// Authenticated Endpoints
router.get('/me', authMiddleware, getMe);

// Admin-only MFA Management
router.get('/mfa-status', authMiddleware, requireAdmin, getMfaStatus);
router.post('/toggle-mfa', authMiddleware, requireAdmin, validate(toggleMfaSchema), toggleMfa);

export default router;

