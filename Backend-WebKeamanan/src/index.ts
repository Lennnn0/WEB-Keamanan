import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { ENV } from './config/env';

// Import Routes
import authRoutes from './routes/authRoutes';
import questionRoutes from './routes/questionRoutes';
import importRoutes from './routes/importRoutes';
import examRoutes from './routes/examRoutes';
import studyMaterialRoutes from './routes/studyMaterialRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import studentManagementRoutes from './routes/studentManagementRoutes';
import scheduleRoutes from './routes/scheduleRoutes';

const app = express();

// Security Middlewares
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

const allowedOrigins = [
  ENV.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin like mobile apps, curl, etc.
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Akses diblokir oleh kebijakan CORS.'), false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (ENV.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check Endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'ExamCenter Secure Backend API',
    timestamp: new Date().toISOString(),
    configured: {
      supabase: ENV.isConfigured.supabase,
      resend: ENV.isConfigured.resend,
    },
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/import', importRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/materials', studyMaterialRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/students', studentManagementRoutes);
app.use('/api/schedules', scheduleRoutes);

// 404 Route Handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint API tidak ditemukan.',
  });
});

// Centralized Error Handling Middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled Application Error:', err);

  const status = err.status || 500;
  const message = err.message || 'Terjadi kesalahan internal pada server.';

  res.status(status).json({
    success: false,
    message,
    ...(ENV.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Start Server
if (process.env.NODE_ENV !== 'test') {
  app.listen(ENV.PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 ExamCenter Backend running on http://localhost:${ENV.PORT}`);
    console.log(`🔒 Environment: ${ENV.NODE_ENV}`);
    console.log(`📡 Supabase configured: ${ENV.isConfigured.supabase ? 'YES' : 'PENDING CREDENTIALS'}`);
    console.log(`📧 Resend API configured: ${ENV.isConfigured.resend ? 'YES' : 'PENDING CREDENTIALS'}`);
    console.log(`====================================================`);
  });
}

export default app;

