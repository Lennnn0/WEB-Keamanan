import { Response } from 'express';
import { AuthenticatedRequest } from '../types';
import * as XLSX from 'xlsx';
import {
  parseRawFileBuffer,
  validateParsedRows,
  commitImportedQuestions,
} from '../services/importParserService';

export const previewImportFile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({
        success: false,
        message: 'Mohon unggah file CSV atau Excel (.xlsx/.xls).',
      });
      return;
    }

    const { buffer, originalname } = req.file;

    // 1. Parse raw data
    let rawRows: Record<string, any>[] = [];
    try {
      rawRows = parseRawFileBuffer(buffer, originalname);
    } catch (parseError: any) {
      res.status(400).json({
        success: false,
        message: `Gagal membaca isi file: ${parseError.message || 'Format file rusak atau tidak didukung.'}`,
      });
      return;
    }

    if (!rawRows || rawRows.length === 0) {
      res.status(400).json({
        success: false,
        message: 'File yang diunggah kosong atau tidak memiliki baris data.',
      });
      return;
    }

    // 2. Validate row-by-row
    const result = validateParsedRows(rawRows);

    res.status(200).json({
      success: true,
      message: `File berhasil diproses: ${result.summary.validCount} valid, ${result.summary.invalidCount} memiliki kesalahan format.`,
      summary: result.summary,
      validRows: result.validRows,
      invalidRows: result.invalidRows,
      fileName: originalname,
    });
  } catch (error: any) {
    console.error('Preview import error:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Terjadi kesalahan saat memproses preview file.',
    });
  }
};

export const commitImportQuestions = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { questions } = req.body;

    if (!Array.isArray(questions) || questions.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Daftar soal yang akan diimpor tidak boleh kosong.',
      });
      return;
    }

    const adminUserId = req.user?.id || '';
    const result = await commitImportedQuestions(questions, adminUserId);

    res.status(200).json(result);
  } catch (error: any) {
    console.error('Commit import error:', error);
    res.status(500).json({
      success: false,
      message: error?.message || 'Terjadi kesalahan saat menyimpan butir soal ke basis data.',
    });
  }
};

export const downloadTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const format = (req.query.format as string) || 'csv';

    const sampleData = [
      {
        question: 'Apa fungsi utama dari protokol TLS/SSL pada komunikasi web?',
        option_a: 'Mempercepat kecepatan download file',
        option_b: 'Mengenkripsi data antara browser dan server untuk mencegah eavesdropping',
        option_c: 'Mengurangi beban memori server',
        option_d: 'Menghilangkan kebutuhan firewall',
        correct_answer: 'B',
        subject: 'Keamanan Web & Jaringan',
        difficulty: 'medium',
        explanation: 'TLS mengenkripsi kanal transmisi HTTP sehingga data sensitif terlindungi.',
        points: 1,
      },
      {
        question: 'Manakah port default yang digunakan untuk protokol HTTPS?',
        option_a: '80',
        option_b: '21',
        option_c: '443',
        option_d: '8080',
        correct_answer: 'C',
        subject: 'Keamanan Web & Jaringan',
        difficulty: 'easy',
        explanation: 'Port 443 adalah port standar terdaftar untuk HTTPS.',
        points: 1,
      },
    ];

    if (format === 'xlsx') {
      const worksheet = XLSX.utils.json_to_sheet(sampleData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Template Soal');

      const xlsxBuffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="examcenter-template-soal.xlsx"');
      res.send(xlsxBuffer);
      return;
    }

    // Default CSV
    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="examcenter-template-soal.csv"');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

