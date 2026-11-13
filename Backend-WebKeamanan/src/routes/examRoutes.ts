import { Router } from 'express';
import {
  getAdminExams,
  getExamById,
  createExam,
  updateExam,
  togglePublishExam,
  deleteExam,
  getAvailableExams,
  startExamAttempt,
  saveStudentAnswer,
  submitExamAttempt,
  getExamResult,
  getStudentHistory,
} from '../controllers/examController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/requireAdmin';
import { requireStudent } from '../middlewares/requireStudent';
import { validate } from '../middlewares/validate';
import {
  createExamSchema,
  updateExamSchema,
  saveAnswerSchema,
} from '../types';

const router = Router();

// ============================================================================
// STUDENT EXAM ROUTES
// ============================================================================
router.get('/available', authMiddleware, requireStudent, getAvailableExams);
router.get('/my-history', authMiddleware, requireStudent, getStudentHistory);
router.post('/:id/start', authMiddleware, requireStudent, startExamAttempt);
router.post('/attempts/:attemptId/save-answer', authMiddleware, requireStudent, validate(saveAnswerSchema), saveStudentAnswer);
router.post('/attempts/:attemptId/submit', authMiddleware, requireStudent, submitExamAttempt);
router.get('/attempts/:attemptId/result', authMiddleware, getExamResult);

// ============================================================================
// ADMIN EXAM ROUTES
// ============================================================================
router.get('/admin/all', authMiddleware, requireAdmin, getAdminExams);
router.get('/:id', authMiddleware, requireAdmin, getExamById);
router.post('/', authMiddleware, requireAdmin, validate(createExamSchema), createExam);
router.put('/:id', authMiddleware, requireAdmin, validate(updateExamSchema), updateExam);
router.patch('/:id/publish', authMiddleware, requireAdmin, togglePublishExam);
router.delete('/:id', authMiddleware, requireAdmin, deleteExam);

export default router;

