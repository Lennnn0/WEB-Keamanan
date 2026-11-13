import { Router } from 'express';
import {
  getAdminDashboardStats,
  getStudentDashboardStats,
} from '../controllers/dashboardController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/requireAdmin';
import { requireStudent } from '../middlewares/requireStudent';

const router = Router();

router.get('/admin', authMiddleware, requireAdmin, getAdminDashboardStats);
router.get('/student', authMiddleware, requireStudent, getStudentDashboardStats);

export default router;

