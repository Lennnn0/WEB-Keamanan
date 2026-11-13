import { supabaseAdmin } from '../config/supabase';
import {
  generateSecureOTP,
  hashOTP,
  verifyOTPHash,
  generateMfaChallengeToken,
  verifyMfaChallengeToken,
  generateAdminSessionToken,
} from '../utils/security';
import { sendOtpEmail } from './emailService';

export interface CreateChallengeResult {
  challengeToken: string;
  expiresInSeconds: number;
  emailMasked: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  adminSessionToken?: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
  retryRemaining?: number;
}

/**
 * Mask email for privacy during OTP display (e.g., ad***@domain.com)
 */
export const maskEmail = (email: string): string => {
  const parts = email.split('@');
  if (parts.length !== 2) return email;
  const [name, domain] = parts;
  if (name.length <= 2) return `${name[0]}*@${domain}`;
  return `${name.substring(0, 2)}***${name.slice(-1)}@${domain}`;
};

/**
 * Creates and dispatches a new MFA OTP Challenge.
 */
export const createOtpChallenge = async (
  userId: string,
  email: string,
  adminName: string
): Promise<CreateChallengeResult> => {
  // Invalidate any existing unused challenges for this user and purpose
  await supabaseAdmin
    .from('otp_challenges')
    .update({ is_used: true })
    .eq('user_id', userId)
    .eq('purpose', 'ADMIN_LOGIN')
    .eq('is_used', false);

  const otpCode = generateSecureOTP();
  const salt = userId; // use userId as unique salt
  const otpHash = hashOTP(otpCode, salt);

  const expiryMinutes = 5;
  const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000).toISOString();

  // Insert challenge into DB
  const { data: challenge, error } = await supabaseAdmin
    .from('otp_challenges')
    .insert({
      user_id: userId,
      otp_hash: otpHash,
      purpose: 'ADMIN_LOGIN',
      expires_at: expiresAt,
      attempts: 0,
      max_attempts: 5,
      is_used: false,
    })
    .select('id')
    .single();

  if (error || !challenge) {
    throw new Error(`Gagal membuat tantangan OTP: ${error?.message || 'Database error'}`);
  }

  // Generate signed temporary challenge token for client
  const challengeToken = generateMfaChallengeToken({
    userId,
    challengeId: challenge.id,
    email,
  });

  // Dispatch OTP email via Resend API
  await sendOtpEmail({
    toEmail: email,
    adminName,
    otpCode,
    expiryMinutes,
  });

  return {
    challengeToken,
    expiresInSeconds: expiryMinutes * 60,
    emailMasked: maskEmail(email),
  };
};

/**
 * Verifies an OTP Challenge and issues an authenticated Admin MFA Session Token.
 */
export const verifyOtpChallenge = async (
  challengeToken: string,
  providedOtp: string
): Promise<VerifyOtpResult> => {
  // 1. Decode and verify signature of challenge token
  const payload = verifyMfaChallengeToken(challengeToken);
  if (!payload) {
    return {
      success: false,
      message: 'Sesi OTP tidak valid atau telah kedaluwarsa. Silakan login kembali.',
    };
  }

  const { challengeId, userId } = payload;

  // 2. Fetch challenge from DB
  const { data: challenge, error } = await supabaseAdmin
    .from('otp_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('user_id', userId)
    .single();

  if (error || !challenge) {
    return {
      success: false,
      message: 'Tantangan OTP tidak ditemukan dalam sistem.',
    };
  }

  // 3. Security checks
  if (challenge.is_used) {
    return {
      success: false,
      message: 'Kode OTP ini sudah pernah digunakan. Silakan minta kode baru.',
    };
  }

  const isExpired = new Date(challenge.expires_at).getTime() < Date.now();
  if (isExpired) {
    return {
      success: false,
      message: 'Kode OTP telah kedaluwarsa (masa berlaku 5 menit). Silakan minta kode baru.',
    };
  }

  if (challenge.attempts >= challenge.max_attempts) {
    return {
      success: false,
      message: 'Batas percobaan OTP telah terlampaui. Tantangan ini telah dikunci demi keamanan.',
      retryRemaining: 0,
    };
  }

  // 4. Verify OTP Hash with constant-time equality
  const salt = userId;
  const isMatch = verifyOTPHash(providedOtp, challenge.otp_hash, salt);

  if (!isMatch) {
    const newAttempts = challenge.attempts + 1;
    const remaining = Math.max(0, challenge.max_attempts - newAttempts);

    // Update attempts count
    await supabaseAdmin
      .from('otp_challenges')
      .update({
        attempts: newAttempts,
        is_used: newAttempts >= challenge.max_attempts, // Burn if max reached
      })
      .eq('id', challenge.id);

    return {
      success: false,
      message:
        remaining > 0
          ? `Kode OTP salah. Sisa kesempatan percobaan: ${remaining} kali.`
          : 'Kode OTP salah. Tantangan telah dikunci karena melebihi batas percobaan.',
      retryRemaining: remaining,
    };
  }

  // 5. Success: Burn the OTP immediately (Single-use guarantee)
  await supabaseAdmin
    .from('otp_challenges')
    .update({ is_used: true })
    .eq('id', challenge.id);

  // 6. Fetch user profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (!profile || profile.role !== 'admin') {
    return {
      success: false,
      message: 'Profil admin tidak ditemukan.',
    };
  }

  // 7. Log activity
  await supabaseAdmin.from('activity_logs').insert({
    user_id: userId,
    action: 'ADMIN_MFA_LOGIN_SUCCESS',
    entity_type: 'AUTH',
    entity_id: userId,
    details: { timestamp: new Date().toISOString() },
  });

  // 8. Generate Admin MFA Session Token
  const adminSessionToken = generateAdminSessionToken({
    userId: profile.id,
    email: profile.email,
    role: profile.role,
  });

  return {
    success: true,
    message: 'Verifikasi OTP berhasil. Selamat datang kembali, Administrator.',
    adminSessionToken,
    user: {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: profile.role,
    },
  };
};

/**
 * Resends a fresh OTP for an existing active session.
 */
export const resendOtp = async (challengeToken: string): Promise<CreateChallengeResult> => {
  const payload = verifyMfaChallengeToken(challengeToken);
  if (!payload) {
    throw new Error('Sesi OTP tidak valid. Silakan login kembali.');
  }

  const { userId, email } = payload;
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', userId)
    .single();

  const name = profile?.full_name || 'Admin';
  return createOtpChallenge(userId, email, name);
};

