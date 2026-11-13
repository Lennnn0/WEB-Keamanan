import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

// ============================================================================
// ADMIN EXAM MANAGEMENT
// ============================================================================

export const getAdminExams = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: exams, error } = await supabaseAdmin
      .from('exams')
      .select('*, subjects(id, name, code), exam_questions(count), exam_attempts(count)')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({ success: true, exams: exams || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: exam, error } = await supabaseAdmin
      .from('exams')
      .select('*, subjects(id, name, code)')
      .eq('id', id)
      .single();

    if (error || !exam) {
      res.status(404).json({ success: false, message: 'Ujian tidak ditemukan.' });
      return;
    }

    // Get assigned questions
    const { data: examQuestions } = await supabaseAdmin
      .from('exam_questions')
      .select('order_index, points, questions(*)')
      .eq('exam_id', id)
      .order('order_index', { ascending: true });

    res.status(200).json({
      success: true,
      exam: {
        ...exam,
        questions: examQuestions?.map((eq) => ({
          ...eq.questions,
          points: eq.points,
          order_index: eq.order_index,
        })) || [],
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createExam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      title,
      description,
      subjectId,
      durationMinutes,
      passingScore,
      isPublished,
      startTime,
      endTime,
      shuffleQuestions,
      shuffleOptions,
      questionIds,
    } = req.body;

    // 1. Insert exam
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .insert({
        title,
        description: description || null,
        subject_id: subjectId || null,
        duration_minutes: durationMinutes,
        passing_score: passingScore || 70,
        is_published: Boolean(isPublished),
        start_time: startTime || null,
        end_time: endTime || null,
        shuffle_questions: Boolean(shuffleQuestions),
        shuffle_options: Boolean(shuffleOptions),
        created_by: req.user?.id || null,
      })
      .select('*')
      .single();

    if (examError || !exam) {
      res.status(500).json({ success: false, message: examError?.message || 'Gagal membuat ujian.' });
      return;
    }

    // 2. Fetch questions points to assign
    const { data: questions } = await supabaseAdmin
      .from('questions')
      .select('id, points')
      .in('id', questionIds);

    const questionMap = new Map<string, number>();
    questions?.forEach((q) => questionMap.set(q.id, Number(q.points) || 1));

    // 3. Link questions
    const junctionRows = questionIds.map((qId: string, idx: number) => ({
      exam_id: exam.id,
      question_id: qId,
      order_index: idx + 1,
      points: questionMap.get(qId) || 1,
    }));

    const { error: junctionError } = await supabaseAdmin
      .from('exam_questions')
      .insert(junctionRows);

    if (junctionError) {
      console.error('Exam questions link error:', junctionError);
    }

    // Audit log
    await supabaseAdmin.from('activity_logs').insert({
      user_id: req.user?.id,
      action: 'CREATE_EXAM',
      entity_type: 'EXAMS',
      entity_id: exam.id,
      details: { title, questionCount: questionIds.length },
    });

    res.status(201).json({
      success: true,
      message: 'Ujian berhasil dibuat.',
      exam,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateExam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updatePayload: Record<string, any> = {};
    if (body.title !== undefined) updatePayload.title = body.title;
    if (body.description !== undefined) updatePayload.description = body.description;
    if (body.subjectId !== undefined) updatePayload.subject_id = body.subjectId;
    if (body.durationMinutes !== undefined) updatePayload.duration_minutes = body.durationMinutes;
    if (body.passingScore !== undefined) updatePayload.passing_score = body.passingScore;
    if (body.isPublished !== undefined) updatePayload.is_published = body.isPublished;
    if (body.startTime !== undefined) updatePayload.start_time = body.startTime;
    if (body.endTime !== undefined) updatePayload.end_time = body.endTime;
    if (body.shuffleQuestions !== undefined) updatePayload.shuffle_questions = body.shuffleQuestions;
    if (body.shuffleOptions !== undefined) updatePayload.shuffle_options = body.shuffleOptions;

    const { data: exam, error } = await supabaseAdmin
      .from('exams')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !exam) {
      res.status(500).json({ success: false, message: error?.message || 'Gagal memperbarui ujian.' });
      return;
    }

    // Update questions if provided
    if (Array.isArray(body.questionIds)) {
      // Remove old
      await supabaseAdmin.from('exam_questions').delete().eq('exam_id', id);

      // Fetch points
      const { data: questions } = await supabaseAdmin
        .from('questions')
        .select('id, points')
        .in('id', body.questionIds);

      const questionMap = new Map<string, number>();
      questions?.forEach((q) => questionMap.set(q.id, Number(q.points) || 1));

      const junctionRows = body.questionIds.map((qId: string, idx: number) => ({
        exam_id: id,
        question_id: qId,
        order_index: idx + 1,
        points: questionMap.get(qId) || 1,
      }));

      await supabaseAdmin.from('exam_questions').insert(junctionRows);
    }

    res.status(200).json({
      success: true,
      message: 'Ujian berhasil diperbarui.',
      exam,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const togglePublishExam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isPublished } = req.body;

    const { data: exam, error } = await supabaseAdmin
      .from('exams')
      .update({ is_published: Boolean(isPublished) })
      .eq('id', id)
      .select('*')
      .single();

    if (error || !exam) {
      res.status(500).json({ success: false, message: error?.message || 'Gagal mengubah status publikasi.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: exam.is_published ? 'Ujian berhasil dipublikasikan.' : 'Ujian ditarik ke draf (tidak dipublikasikan).',
      exam,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteExam = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin.from('exams').delete().eq('id', id);

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({ success: true, message: 'Ujian berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============================================================================
// STUDENT EXAM ACCESS & TAKING
// ============================================================================

export const getAvailableExams = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;

    // Fetch published exams
    const { data: exams, error } = await supabaseAdmin
      .from('exams')
      .select('id, title, description, duration_minutes, passing_score, start_time, end_time, created_at, subjects(id, name, code)')
      .eq('is_published', true)
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    // Fetch student's attempts for these exams
    const examIds = (exams || []).map((e) => e.id);
    let attemptsMap = new Map<string, any>();

    if (examIds.length > 0 && studentId) {
      const { data: attempts } = await supabaseAdmin
        .from('exam_attempts')
        .select('*')
        .eq('student_id', studentId)
        .in('exam_id', examIds);

      attempts?.forEach((att) => {
        attemptsMap.set(att.exam_id, att);
      });
    }

    // Merge status
    const enriched = (exams || []).map((exam) => {
      const attempt = attemptsMap.get(exam.id);
      return {
        ...exam,
        userAttempt: attempt || null,
        status: attempt
          ? attempt.status === 'submitted'
            ? 'COMPLETED'
            : 'IN_PROGRESS'
          : 'AVAILABLE',
      };
    });

    res.status(200).json({ success: true, exams: enriched });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const startExamAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: examId } = req.params;
    const studentId = req.user?.id;

    if (!studentId) {
      res.status(401).json({ success: false, message: 'Autentikasi diperlukan.' });
      return;
    }

    // 1. Fetch exam details
    const { data: exam, error: examError } = await supabaseAdmin
      .from('exams')
      .select('*')
      .eq('id', examId)
      .eq('is_published', true)
      .single();

    if (examError || !exam) {
      res.status(404).json({ success: false, message: 'Ujian tidak ditemukan atau belum dipublikasikan.' });
      return;
    }

    // 2. Check existing attempt
    const { data: existingAttempt } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .maybeSingle();

    if (existingAttempt && existingAttempt.status === 'submitted') {
      res.status(400).json({
        success: false,
        message: 'Anda sudah pernah menyelesaikan ujian ini. Tidak diizinkan melakukan pengerjaan ulang.',
        attemptId: existingAttempt.id,
      });
      return;
    }

    let attemptId = existingAttempt?.id;
    let startedAt = existingAttempt?.started_at;

    // If no attempt yet, create one
    if (!existingAttempt) {
      const { data: newAttempt, error: attemptError } = await supabaseAdmin
        .from('exam_attempts')
        .insert({
          exam_id: examId,
          student_id: studentId,
          status: 'in_progress',
          started_at: new Date().toISOString(),
        })
        .select('*')
        .single();

      if (attemptError || !newAttempt) {
        res.status(500).json({ success: false, message: 'Gagal memulai sesi ujian.' });
        return;
      }
      attemptId = newAttempt.id;
      startedAt = newAttempt.started_at;
    }

    // 3. Fetch questions linked to exam
    // ⚠️ CRITICAL SECURITY REQUIREMENT: DO NOT SELECT 'correct_answer' or 'explanation'!
    const { data: examQuestions, error: qError } = await supabaseAdmin
      .from('exam_questions')
      .select(`
        order_index,
        points,
        questions (
          id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          difficulty,
          subject_name
        )
      `)
      .eq('exam_id', examId)
      .order('order_index', { ascending: true });

    if (qError) {
      res.status(500).json({ success: false, message: qError.message });
      return;
    }

    // 4. Fetch any saved answers for this attempt
    const { data: savedAnswers } = await supabaseAdmin
      .from('exam_answers')
      .select('question_id, selected_option')
      .eq('attempt_id', attemptId);

    const savedMap = new Map<string, string>();
    savedAnswers?.forEach((a) => {
      if (a.selected_option) savedMap.set(a.question_id, a.selected_option);
    });

    const safeQuestions = (examQuestions || []).map((eq: any) => ({
      id: eq.questions.id,
      questionText: eq.questions.question_text,
      optionA: eq.questions.option_a,
      optionB: eq.questions.option_b,
      optionC: eq.questions.option_c,
      optionD: eq.questions.option_d,
      difficulty: eq.questions.difficulty,
      subjectName: eq.questions.subject_name,
      points: eq.points,
      orderIndex: eq.order_index,
      savedAnswer: savedMap.get(eq.questions.id) || null,
    }));

    res.status(200).json({
      success: true,
      attemptId,
      startedAt,
      durationMinutes: exam.duration_minutes,
      exam: {
        id: exam.id,
        title: exam.title,
        description: exam.description,
        passingScore: exam.passing_score,
      },
      questions: safeQuestions,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const saveStudentAnswer = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const { questionId, selectedOption } = req.body;
    const studentId = req.user?.id;

    // 1. Verify attempt ownership and active status
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*')
      .eq('id', attemptId)
      .eq('student_id', studentId)
      .single();

    if (attemptError || !attempt) {
      res.status(404).json({ success: false, message: 'Sesi ujian tidak valid.' });
      return;
    }

    if (attempt.status !== 'in_progress') {
      res.status(400).json({
        success: false,
        message: 'Sesi ujian telah dikunci/diserahkan. Jawaban tidak dapat diubah lagi.',
      });
      return;
    }

    // 2. Upsert answer
    const { error: upsertError } = await supabaseAdmin
      .from('exam_answers')
      .upsert(
        {
          attempt_id: attemptId,
          question_id: questionId,
          selected_option: selectedOption,
          answered_at: new Date().toISOString(),
        },
        { onConflict: 'attempt_id,question_id' }
      );

    if (upsertError) {
      res.status(500).json({ success: false, message: upsertError.message });
      return;
    }

    res.status(200).json({ success: true, message: 'Jawaban tersimpan otomatis.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const submitExamAttempt = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const studentId = req.user?.id;

    // 1. Check attempt
    const { data: attempt, error: attemptError } = await supabaseAdmin
      .from('exam_attempts')
      .select('*, exams(*)')
      .eq('id', attemptId)
      .eq('student_id', studentId)
      .single();

    if (attemptError || !attempt) {
      res.status(404).json({ success: false, message: 'Sesi ujian tidak ditemukan.' });
      return;
    }

    if (attempt.status === 'submitted') {
      res.status(400).json({
        success: false,
        message: 'Ujian ini sudah pernah diserahkan sebelumnya.',
      });
      return;
    }

    // 2. Fetch all real questions and true correct answers from DB
    const { data: examQuestions } = await supabaseAdmin
      .from('exam_questions')
      .select('points, questions(id, correct_answer)')
      .eq('exam_id', attempt.exam_id);

    // 3. Fetch student's answers
    const { data: studentAnswers } = await supabaseAdmin
      .from('exam_answers')
      .select('*')
      .eq('attempt_id', attemptId);

    const studentAnswerMap = new Map<string, string>();
    studentAnswers?.forEach((a) => {
      if (a.selected_option) studentAnswerMap.set(a.question_id, a.selected_option);
    });

    // 4. Calculate total score on backend securely
    let totalScore = 0;
    let maxScore = 0;
    const answerUpdates: any[] = [];

    (examQuestions || []).forEach((eq: any) => {
      const qId = eq.questions.id;
      const trueCorrect = eq.questions.correct_answer;
      const questionPoints = Number(eq.points) || 1;
      maxScore += questionPoints;

      const chosen = studentAnswerMap.get(qId);
      const isCorrect = chosen === trueCorrect;
      const pointsAwarded = isCorrect ? questionPoints : 0;
      if (isCorrect) {
        totalScore += questionPoints;
      }

      answerUpdates.push({
        attempt_id: attemptId,
        question_id: qId,
        selected_option: chosen || null,
        is_correct: isCorrect,
        points_awarded: pointsAwarded,
      });
    });

    // Upsert evaluated answers
    if (answerUpdates.length > 0) {
      await supabaseAdmin.from('exam_answers').upsert(answerUpdates, {
        onConflict: 'attempt_id,question_id',
      });
    }

    // Calculate percentage and pass status
    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100 * 10) / 10 : 0;
    const isPassed = percentage >= Number(attempt.exams.passing_score);

    // 5. Lock attempt and update final score
    const { data: finalAttempt, error: updateError } = await supabaseAdmin
      .from('exam_attempts')
      .update({
        status: 'submitted',
        submitted_at: new Date().toISOString(),
        total_score: totalScore,
        max_score: maxScore,
        percentage,
        is_passed: isPassed,
      })
      .eq('id', attemptId)
      .select('*')
      .single();

    if (updateError) {
      res.status(500).json({ success: false, message: updateError.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Ujian berhasil diserahkan dan dinilai oleh sistem.',
      result: {
        attemptId: finalAttempt.id,
        totalScore,
        maxScore,
        percentage,
        isPassed,
        passingScore: attempt.exams.passing_score,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getExamResult = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { attemptId } = req.params;
    const user = req.user;

    // Fetch attempt
    let query = supabaseAdmin
      .from('exam_attempts')
      .select('*, exams(id, title, description, passing_score, duration_minutes, subjects(name)), profiles(full_name, email)')
      .eq('id', attemptId);

    if (user?.role !== 'admin') {
      query = query.eq('student_id', user?.id);
    }

    const { data: attempt, error: attemptError } = await query.single();

    if (attemptError || !attempt) {
      res.status(404).json({ success: false, message: 'Hasil ujian tidak ditemukan.' });
      return;
    }

    // Fetch student's answers with full explanations now that the exam is submitted!
    const { data: answers } = await supabaseAdmin
      .from('exam_answers')
      .select(`
        question_id,
        selected_option,
        is_correct,
        points_awarded,
        questions (
          id,
          question_text,
          option_a,
          option_b,
          option_c,
          option_d,
          correct_answer,
          explanation,
          points,
          difficulty
        )
      `)
      .eq('attempt_id', attemptId);

    res.status(200).json({
      success: true,
      attempt,
      answers: answers || [],
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getStudentHistory = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const studentId = req.user?.id;

    const { data: attempts, error } = await supabaseAdmin
      .from('exam_attempts')
      .select('*, exams(id, title, duration_minutes, passing_score, subjects(name))')
      .eq('student_id', studentId)
      .order('started_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({ success: true, history: attempts || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

