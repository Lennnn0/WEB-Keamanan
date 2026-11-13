import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';

/**
 * Generate a cryptographically secure 6-digit OTP string.
 */
export const generateSecureOTP = (): string => {
  const otpNumber = crypto.randomInt(100000, 1000000);
  return otpNumber.toString();
};

/**
 * Hash an OTP using SHA-256 with salt/pepper.
 * We never store OTP in plaintext in the database.
 */
export const hashOTP = (otp: string, salt: string = ''): string => {
  const pepper = ENV.JWT_MFA_SECRET;
  return crypto
    .createHash('sha256')
    .update(`${salt}:${otp}:${pepper}`)
    .digest('hex');
};

/**
 * Perform a constant-time / timing-safe equality check between two hashes.
 */
export const verifyOTPHash = (providedOtp: string, expectedHash: string, salt: string = ''): boolean => {
  const computedHash = hashOTP(providedOtp, salt);
  if (computedHash.length !== expectedHash.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(computedHash), Buffer.from(expectedHash));
};

/**
 * Sign a temporary MFA challenge token to identify the session between Step 1 and Step 2.
 */
export const generateMfaChallengeToken = (payload: { userId: string; challengeId: string; email: string }): string => {
  return jwt.sign(
    {
      ...payload,
      type: 'mfa_challenge',
    },
    ENV.JWT_MFA_SECRET,
    { expiresIn: '5m' }
  );
};

/**
 * Verify an MFA challenge token.
 */
export const verifyMfaChallengeToken = (token: string): { userId: string; challengeId: string; email: string } | null => {
  try {
    const decoded = jwt.verify(token, ENV.JWT_MFA_SECRET) as any;
    if (decoded && decoded.type === 'mfa_challenge') {
      return {
        userId: decoded.userId,
        challengeId: decoded.challengeId,
        email: decoded.email,
      };
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * Generate Admin MFA Session Token after successful OTP verification.
 */
export const generateAdminSessionToken = (payload: { userId: string; email: string; role: string }): string => {
  return jwt.sign(
    {
      ...payload,
      mfaVerified: true,
      type: 'admin_session',
    },
    ENV.JWT_MFA_SECRET,
    { expiresIn: '8h' }
  );
};

/**
 * Verify Admin MFA Session Token.
 */
export const verifyAdminSessionToken = (token: string): any => {
  try {
    return jwt.verify(token, ENV.JWT_MFA_SECRET);
  } catch {
    return null;
  }
};

