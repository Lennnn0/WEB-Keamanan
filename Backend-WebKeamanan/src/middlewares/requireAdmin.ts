import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { supabaseAdmin } from '../config/supabase';

export const requireAdmin = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Autentikasi diperlukan.',
    });
    return;
  }

  if (req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Akses terlarang. Endpoint ini khusus untuk Administrator.',
    });
    return;
  }

  // Check MFA status for admin
  try {
    const { data: mfaSetting } = await supabaseAdmin
      .from('admin_mfa_settings')
      .select('is_mfa_enabled')
      .eq('user_id', req.user.id)
      .single();

    const isMfaActive = mfaSetting?.is_mfa_enabled === true;

    if (isMfaActive && !req.user.mfaVerified) {
      res.status(403).json({
        success: false,
        code: 'MFA_REQUIRED',
        message: 'Akses admin diblokir: Verifikasi Multi-Factor Authentication (OTP Email) diperlukan.',
      });
      return;
    }

    next();
  } catch (err) {
    console.error('Error checking admin MFA status:', err);
    // If settings check fails, deny access safely
    res.status(500).json({
      success: false,
      message: 'Gagal memverifikasi status keamanan admin.',
    });
  }
};

