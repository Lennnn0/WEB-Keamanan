import { Router } from 'express';
import {
  getStudyMaterials,
  createStudyMaterial,
  deleteStudyMaterial,
} from '../controllers/studyMaterialController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/requireAdmin';
import { validate } from '../middlewares/validate';
import { createMaterialSchema } from '../types';

const router = Router();

// Authenticated users (admin & students) can view materials
router.get('/', authMiddleware, getStudyMaterials);

// Admin-only upload & delete
router.post('/', authMiddleware, requireAdmin, validate(createMaterialSchema), createStudyMaterial);
router.delete('/:id', authMiddleware, requireAdmin, deleteStudyMaterial);

export default router;

