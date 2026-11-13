import { Request, Response } from 'express';
import { supabaseAdmin, supabaseAnon } from '../config/supabase';
import { AuthenticatedRequest } from '../types';
import { createOtpChallenge, verifyOtpChallenge, resendOtp } from '../services/otpService';

export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, fullName } = req.body;

    // 1. Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        role: 'student',
      },
    });

    if (authError || !authData.user) {
      res.status(400).json({
        success: false,
        message: authError?.message || 'Gagal mendaftarkan akun siswa.',
      });
      return;
    }

    // 2. Insert into profiles table
    const { error: profileError } = await supabaseAdmin.from('profiles').upsert({
      id: authData.user.id,
      email,
      full_name: fullName,
      role: 'student',
    });

    if (profileError) {
      console.error('Profile creation error:', profileError);
    }

    // 3. Generate initial session
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Pendaftaran siswa berhasil! Selamat datang di ExamCenter.',
      token: signInData?.session?.access_token || '',
      user: {
        id: authData.user.id,
        email,
        full_name: fullName,
        role: 'student',
      },
    });
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Terjadi kesalahan internal pada server.',
    });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user || !authData.session) {
      res.status(401).json({
        success: false,
        message: 'Kombinasi email atau password salah. Mohon periksa kembali kredensial Anda.',
      });
      return;
    }

    const userId = authData.user.id;

    // 2. Fetch profile from DB
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      res.status(404).json({
        success: false,
        message: 'Profil pengguna tidak ditemukan.',
      });
      return;
    }

    // 3. If user is Student, issue token immediately (No Admin MFA required for students)
    if (profile.role !== 'admin') {
      res.status(200).json({
        success: true,
        message: 'Login berhasil.',
        mfaRequired: false,
        token: authData.session.access_token,
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
        },
      });
      return;
    }

    // 4. User is Admin: Check MFA Setting
    const { data: mfaSetting } = await supabaseAdmin
      .from('admin_mfa_settings')
      .select('is_mfa_enabled')
      .eq('user_id', userId)
      .single();

    const isMfaActive = mfaSetting?.is_mfa_enabled === true;

    // 4A. If MFA is DISABLED by Admin, allow standard login
    if (!isMfaActive) {
      res.status(200).json({
        success: true,
        message: 'Login berhasil (MFA non-aktif).',
        mfaRequired: false,
        token: authData.session.access_token,
        user: {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: profile.role,
        },
      });
      return;
    }

    // 4B. If MFA is ENABLED, trigger Email OTP Challenge
    // DO NOT provide access token yet!
    const challengeResult = await createOtpChallenge(userId, profile.email, profile.full_name);

    res.status(200).json({
      success: true,
      message: 'Kredensial valid. Kode OTP 6 digit telah dikirim ke email Administrator Anda.',
      mfaRequired: true,
      challengeToken: challengeResult.challengeToken,
      expiresInSeconds: challengeResult.expiresInSeconds,
      emailMasked: challengeResult.emailMasked,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Terjadi kesalahan saat memproses login.',
    });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { challengeToken, otp } = req.body;

    const result = await verifyOtpChallenge(challengeToken, otp);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
        retryRemaining: result.retryRemaining,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      token: result.adminSessionToken,
      user: result.user,
    });
  } catch (error: any) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Terjadi kesalahan saat memverifikasi OTP.',
    });
  }
};

export const resendOtpController = async (req: Request, res: Response): Promise<void> => {
  try {
    const { challengeToken } = req.body;

    const result = await resendOtp(challengeToken);

    res.status(200).json({
      success: true,
      message: 'Kode OTP baru berhasil dikirim ke email Anda.',
      challengeToken: result.challengeToken,
      expiresInSeconds: result.expiresInSeconds,
      emailMasked: result.emailMasked,
    });
  } catch (error: any) {
    console.error('Resend OTP error:', error);
    res.status(400).json({
      success: false,
      message: error?.message || 'Gagal mengirim ulang OTP.',
    });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
    return;
  }

  // Fetch fresh profile
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('id', req.user.id)
    .single();

  let isMfaEnabled = false;
  if (profile?.role === 'admin') {
    const { data: mfaSetting } = await supabaseAdmin
      .from('admin_mfa_settings')
      .select('is_mfa_enabled')
      .eq('user_id', req.user.id)
      .single();
    isMfaEnabled = mfaSetting?.is_mfa_enabled === true;
  }

  res.status(200).json({
    success: true,
    user: {
      ...profile,
      isMfaEnabled,
    },
  });
};

export const getMfaStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
    return;
  }

  const { data } = await supabaseAdmin
    .from('admin_mfa_settings')
    .select('is_mfa_enabled, updated_at')
    .eq('user_id', req.user.id)
    .single();

  res.status(200).json({
    success: true,
    isMfaEnabled: data?.is_mfa_enabled === true,
    updatedAt: data?.updated_at || null,
  });
};

export const toggleMfa = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ success: false, message: 'Tidak terotentikasi.' });
    return;
  }

  const { enabled } = req.body;

  const { data, error } = await supabaseAdmin
    .from('admin_mfa_settings')
    .upsert({
      user_id: req.user.id,
      is_mfa_enabled: enabled,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal memperbarui status MFA.',
    });
    return;
  }

  // Audit log
  await supabaseAdmin.from('activity_logs').insert({
    user_id: req.user.id,
    action: enabled ? 'ENABLE_ADMIN_MFA' : 'DISABLE_ADMIN_MFA',
    entity_type: 'SECURITY_SETTINGS',
    details: { is_mfa_enabled: enabled, timestamp: new Date().toISOString() },
  });

  res.status(200).json({
    success: true,
    message: enabled
      ? 'Multi-Factor Authentication (OTP Email) berhasil diaktifkan untuk akun Anda.'
      : 'Multi-Factor Authentication (OTP Email) telah dinonaktifkan.',
    isMfaEnabled: data.is_mfa_enabled,
  });
};

