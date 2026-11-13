import { Router } from 'express';
import { getStudents, getStudentDetails } from '../controllers/studentManagementController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = Router();

router.get('/', authMiddleware, requireAdmin, getStudents);
router.get('/:id', authMiddleware, requireAdmin, getStudentDetails);

export default router;

