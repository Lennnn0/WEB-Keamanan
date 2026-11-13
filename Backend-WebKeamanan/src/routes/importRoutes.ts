import { Router } from 'express';
import multer from 'multer';
import {
  previewImportFile,
  commitImportQuestions,
  downloadTemplate,
} from '../controllers/importController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { requireAdmin } from '../middlewares/requireAdmin';

const router = Router();

// Configure in-memory upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
    ];
    const allowedExts = ['.csv', '.xlsx', '.xls'];
    const hasValidExt = allowedExts.some((ext) => file.originalname.toLowerCase().endsWith(ext));

    if (allowedMimes.includes(file.mimetype) || hasValidExt) {
      cb(null, true);
    } else {
      cb(new Error('Format file tidak didukung. Mohon unggah file CSV atau Excel (.xlsx).'));
    }
  },
});

// Admin Import Endpoints
router.get('/template', authMiddleware, requireAdmin, downloadTemplate);
router.post('/preview', authMiddleware, requireAdmin, upload.single('file'), previewImportFile);
router.post('/commit', authMiddleware, requireAdmin, commitImportQuestions);

export default router;

