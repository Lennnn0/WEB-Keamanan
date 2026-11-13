import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

export const getAdminDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    // Parallel queries for fast stats
    const [
      studentsCountRes,
      examsCountRes,
      questionsCountRes,
      attemptsRes,
      activityLogsRes,
    ] = await Promise.all([
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student'),
      supabaseAdmin.from('exams').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('questions').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('exam_attempts').select('status, is_passed, total_score, max_score, percentage'),
      supabaseAdmin.from('activity_logs').select('*, profiles(full_name, email)').order('created_at', { ascending: false }).limit(8),
    ]);

    const totalStudents = studentsCountRes.count || 0;
    const totalExams = examsCountRes.count || 0;
    const totalQuestions = questionsCountRes.count || 0;

    const attempts = attemptsRes.data || [];
    const submittedAttempts = attempts.filter((a) => a.status === 'submitted');
    const passedAttempts = submittedAttempts.filter((a) => a.is_passed === true);

    const averageScore = submittedAttempts.length > 0
      ? Math.round(
          (submittedAttempts.reduce((acc, cur) => acc + (Number(cur.percentage) || 0), 0) /
            submittedAttempts.length) * 10
        ) / 10
      : 0;

    const passRate = submittedAttempts.length > 0
      ? Math.round((passedAttempts.length / submittedAttempts.length) * 100)
      : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalStudents,
        totalExams,
        totalQuestions,
        totalSubmissions: submittedAttempts.length,
        averageScore,
        passRate,
      },
      recentActivity: activityLogsRes.data || [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentDashboardStats = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;

    const [availableExamsRes, myAttemptsRes, materialsRes] = await Promise.all([
      supabaseAdmin.from('exams').select('id, title, is_published, duration_minutes, passing_score').eq('is_published', true),
      supabaseAdmin.from('exam_attempts').select('*, exams(title, duration_minutes, passing_score)').eq('student_id', studentId).order('created_at', { ascending: false }),
      supabaseAdmin.from('study_materials').select('*').order('created_at', { ascending: false }).limit(4),
    ]);

    const attempts = myAttemptsRes.data || [];
    const submitted = attempts.filter((a) => a.status === 'submitted');
    const passed = submitted.filter((a) => a.is_passed === true);

    const averageScore = submitted.length > 0
      ? Math.round(
          (submitted.reduce((acc, cur) => acc + (Number(cur.percentage) || 0), 0) /
            submitted.length) * 10
        ) / 10
      : 0;

    const submittedExamIds = new Set(submitted.map((a) => a.exam_id));
    const pendingExams = (availableExamsRes.data || []).filter((e) => !submittedExamIds.has(e.id));

    res.status(200).json({
      success: true,
      stats: {
        totalAvailableExams: availableExamsRes.data?.length || 0,
        pendingExamsCount: pendingExams.length,
        completedExamsCount: submitted.length,
        passedCount: passed.length,
        averageScore,
      },
      recentAttempts: attempts.slice(0, 5),
      recommendedMaterials: materialsRes.data || [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

