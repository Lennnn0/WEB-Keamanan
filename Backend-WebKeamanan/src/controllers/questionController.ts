import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

export const getQuestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      search = '',
      subject = '',
      difficulty = '',
      page = '1',
      limit = '10',
    } = req.query as Record<string, string>;

    const pageNumber = Math.max(1, parseInt(page, 10));
    const pageSize = Math.max(1, Math.min(100, parseInt(limit, 10)));
    const offset = (pageNumber - 1) * pageSize;

    let query = supabaseAdmin
      .from('questions')
      .select('*, subjects(id, name, code)', { count: 'exact' });

    if (search.trim()) {
      query = query.ilike('question_text', `%${search.trim()}%`);
    }

    if (subject.trim()) {
      query = query.eq('subject_name', subject.trim());
    }

    if (difficulty.trim()) {
      query = query.eq('difficulty', difficulty.trim());
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: questions, count, error } = await query;

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      questions: questions || [],
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getQuestionById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !question) {
      res.status(404).json({ success: false, message: 'Soal tidak ditemukan.' });
      return;
    }

    res.status(200).json({ success: true, question });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createQuestion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const {
      subjectId,
      subjectName,
      questionText,
      optionA,
      optionB,
      optionC,
      optionD,
      correctAnswer,
      explanation,
      difficulty,
      points,
    } = req.body;

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .insert({
        subject_id: subjectId || null,
        subject_name: subjectName || 'Umum',
        question_text: questionText,
        option_a: optionA,
        option_b: optionB,
        option_c: optionC,
        option_d: optionD,
        correct_answer: correctAnswer,
        explanation: explanation || null,
        difficulty: difficulty || 'medium',
        points: points || 1,
        created_by: req.user?.id || null,
      })
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Soal berhasil ditambahkan ke Bank Soal.',
      question,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateQuestion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updatePayload: Record<string, any> = {};
    if (body.subjectId !== undefined) updatePayload.subject_id = body.subjectId;
    if (body.subjectName !== undefined) updatePayload.subject_name = body.subjectName;
    if (body.questionText !== undefined) updatePayload.question_text = body.questionText;
    if (body.optionA !== undefined) updatePayload.option_a = body.optionA;
    if (body.optionB !== undefined) updatePayload.option_b = body.optionB;
    if (body.optionC !== undefined) updatePayload.option_c = body.optionC;
    if (body.optionD !== undefined) updatePayload.option_d = body.optionD;
    if (body.correctAnswer !== undefined) updatePayload.correct_answer = body.correctAnswer;
    if (body.explanation !== undefined) updatePayload.explanation = body.explanation;
    if (body.difficulty !== undefined) updatePayload.difficulty = body.difficulty;
    if (body.points !== undefined) updatePayload.points = body.points;

    const { data: question, error } = await supabaseAdmin
      .from('questions')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single();

    if (error || !question) {
      res.status(500).json({ success: false, message: error?.message || 'Gagal memperbarui soal.' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Soal berhasil diperbarui.',
      question,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteQuestion = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('questions')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Soal berhasil dihapus dari Bank Soal.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSubjects = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: subjects, error } = await supabaseAdmin
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({ success: true, subjects: subjects || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

