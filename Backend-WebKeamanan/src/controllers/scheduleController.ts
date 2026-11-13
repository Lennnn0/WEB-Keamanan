import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

export const getSchedules = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: schedules, error } = await supabaseAdmin
      .from('exam_schedules')
      .select('*, exams(id, title, duration_minutes, passing_score, is_published, subjects(name))')
      .order('start_time', { ascending: true });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({ success: true, schedules: schedules || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { examId, title, startTime, endTime, status } = req.body;

    const { data: schedule, error } = await supabaseAdmin
      .from('exam_schedules')
      .insert({
        exam_id: examId,
        title,
        start_time: startTime,
        end_time: endTime,
        status: status || 'scheduled',
      })
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: 'Jadwal ujian berhasil ditambahkan.',
      schedule,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateScheduleStatus = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data: schedule, error } = await supabaseAdmin
      .from('exam_schedules')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Status jadwal berhasil diperbarui.',
      schedule,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin.from('exam_schedules').delete().eq('id', id);

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({ success: true, message: 'Jadwal berhasil dihapus.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

