import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';

export const requireStudent = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Autentikasi diperlukan.',
    });
    return;
  }

  // Admins can also inspect or student endpoints if needed, but primarily for students
  if (req.user.role !== 'student' && req.user.role !== 'admin') {
    res.status(403).json({
      success: false,
      message: 'Akses terlarang. Anda bukan siswa terdaftar.',
    });
    return;
  }

  next();
};

