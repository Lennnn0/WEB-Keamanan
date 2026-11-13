import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AuthenticatedUser } from '../types';
import { supabaseAdmin } from '../config/supabase';
import { verifyAdminSessionToken } from '../utils/security';

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Akses ditolak. Token otentikasi tidak ditemukan.',
      });
      return;
    }

    const token = authHeader.split(' ')[1];

    // 1. Check if token is an internal Admin MFA Session Token
    const adminSession = verifyAdminSessionToken(token);
    if (adminSession && adminSession.type === 'admin_session') {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('id', adminSession.userId)
        .single();

      if (error || !profile) {
        res.status(401).json({
          success: false,
          message: 'Sesi admin tidak valid atau profil tidak ditemukan.',
        });
        return;
      }

      req.user = {
        id: profile.id,
        email: profile.email,
        role: profile.role,
        full_name: profile.full_name,
        mfaVerified: true,
      };
      next();
      return;
    }

    // 2. Otherwise verify via Supabase Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      res.status(401).json({
        success: false,
        message: 'Sesi telah kedaluwarsa atau token tidak valid.',
      });
      return;
    }

    // 3. Fetch user profile from database
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      // Auto-fallback: create profile if missing
      const newProfile = {
        id: user.id,
        email: user.email || '',
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Pengguna',
        role: (user.user_metadata?.role as any) || 'student',
      };
      await supabaseAdmin.from('profiles').insert(newProfile);

      req.user = {
        id: newProfile.id,
        email: newProfile.email,
        role: newProfile.role,
        full_name: newProfile.full_name,
        mfaVerified: false,
      };
      next();
      return;
    }

    req.user = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
      full_name: profile.full_name,
      mfaVerified: false,
    };

    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err);
    res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal saat memverifikasi sesi.',
    });
  }
};

