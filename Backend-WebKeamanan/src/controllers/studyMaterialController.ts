import { Response } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { AuthenticatedRequest } from '../types';

export const getStudyMaterials = async (_req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { data: materials, error } = await supabaseAdmin
      .from('study_materials')
      .select('*, subjects(id, name, code)')
      .order('created_at', { ascending: false });

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({ success: true, materials: materials || [] });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createStudyMaterial = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, description, subjectId, fileUrl, fileName, contentType } = req.body;

    const { data: material, error } = await supabaseAdmin
      .from('study_materials')
      .insert({
        title,
        description: description || null,
        subject_id: subjectId || null,
        file_url: fileUrl,
        file_name: fileName,
        content_type: contentType || 'application/pdf',
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
      message: 'Materi pembelajaran berhasil ditambahkan.',
      material,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteStudyMaterial = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const { error } = await supabaseAdmin
      .from('study_materials')
      .delete()
      .eq('id', id);

    if (error) {
      res.status(500).json({ success: false, message: error.message });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Materi pembelajaran berhasil dihapus.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

