import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

export const getStudents = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { search = '' } = req.query as { search?: string };

    let query = supabaseAdmin
      .from('profiles')
      .select('id, email, full_name, role, created_at, avatar_url')
      .eq('role', 'student')
      .order('created_at', { ascending: false });

    if (search.trim()) {
      query = query.or(`full_name.ilike.%${search.trim()}%,email.ilike.%${search.trim()}%`);
    }

    const { data: students, error } = await query;

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    // Enrich with attempt counts and stats
    const studentIds = (students || []).map((s) => s.id);
    let attemptsMap = new Map<string, any[]>();

    if (studentIds.length > 0) {
      const { data: attempts } = await supabaseAdmin
        .from('exam_attempts')
        .select('student_id, status, is_passed, percentage')
        .in('student_id', studentIds);

      attempts?.forEach((att) => {
        const list = attemptsMap.get(att.student_id) || [];
        list.push(att);
        attemptsMap.set(att.student_id, list);
      });
    }

    const enriched = (students || []).map((s) => {
      const studentAttempts = attemptsMap.get(s.id) || [];
      const submitted = studentAttempts.filter((a) => a.status === 'submitted');
      const passed = submitted.filter((a) => a.is_passed === true);
      const avg = submitted.length > 0
        ? Math.round(
            (submitted.reduce((acc, c) => acc + (Number(c.percentage) || 0), 0) /
              submitted.length) * 10
          ) / 10
        : 0;

      return {
        ...s,
        totalAttempts: studentAttempts.length,
        completedExams: submitted.length,
        passedExams: passed.length,
        averageScore: avg,
      };
    });

    res.status(200).json({ success: true, students: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentDetails = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: profile, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !profile) {
      res.status(404).json({ success: false, message: 'Data siswa tidak ditemukan.' });
      return;
    }

    const { data: attempts } = await supabaseAdmin
      .from('exam_attempts')
      .select('*, exams(title, duration_minutes, passing_score)')
      .eq('student_id', id)
      .order('started_at', { ascending: false });

    res.status(200).json({
      success: true,
      student: profile,
      attempts: attempts || [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

