import { Router } from 'express';
import {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getSubjects,
} from '../controllers/questionController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import { createQuestionSchema, updateQuestionSchema } from '../types';

const router = Router();

// Subject list can be accessed by any authenticated user
router.get('/subjects', authMiddleware, getSubjects);

// Question Bank management (Admin with verified MFA only)
router.get('/', authMiddleware, requireAdmin, getQuestions);
router.get('/:id', authMiddleware, requireAdmin, getQuestionById);
router.post('/', authMiddleware, requireAdmin, validate(createQuestionSchema), createQuestion);
router.put('/:id', authMiddleware, requireAdmin, validate(updateQuestionSchema), updateQuestion);
router.delete('/:id', authMiddleware, requireAdmin, deleteQuestion);

export default router;

