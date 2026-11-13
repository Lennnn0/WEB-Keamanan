import { Router } from 'express';
import {
  getSchedules,
  createSchedule,
  updateScheduleStatus,
  deleteSchedule,
} from '../controllers/scheduleController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import { createScheduleSchema } from '../types';

const router = Router();

// Authenticated users can view schedules
router.get('/', authMiddleware, getSchedules);

// Admin-only management
router.post('/', authMiddleware, requireAdmin, validate(createScheduleSchema), createSchedule);
router.patch('/:id/status', authMiddleware, requireAdmin, updateScheduleStatus);
router.delete('/:id', authMiddleware, requireAdmin, deleteSchedule);

export default router;

