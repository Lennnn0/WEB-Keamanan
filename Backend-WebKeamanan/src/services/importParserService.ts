import * as XLSX from 'xlsx';
import { parse as parseCsvSync } from 'csv-parse/sync';
import { importQuestionRowSchema, ImportQuestionRow } from '../types';
import { supabaseAdmin } from '../config/supabase';

export interface RowValidationError {
  rowNumber: number;
  field: string;
  message: string;
}

export interface ParseResult {
  summary: {
    totalRows: number;
    validCount: number;
    invalidCount: number;
  };
  validRows: (ImportQuestionRow & { rowNumber: number })[];
  invalidRows: {
    rowNumber: number;
    rawData: Record<string, any>;
    errors: string[];
  }[];
}

/**
 * Normalizes header keys to standard lowercase underscored strings.
 * e.g., "Pilihan A" -> "option_a", "Jawaban Benar" -> "correct_answer", etc.
 */
export const normalizeRowKeys = (row: Record<string, any>): Record<string, any> => {
  const normalized: Record<string, any> = {};

  for (const [key, val] of Object.entries(row)) {
    const cleanKey = key.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');

    // Question
    if (['question', 'pertanyaan', 'soal', 'soal_ujian'].includes(cleanKey)) {
      normalized['question'] = val;
    }
    // Option A
    else if (['option_a', 'pilihan_a', 'opsi_a', 'a'].includes(cleanKey)) {
      normalized['option_a'] = val;
    }
    // Option B
    else if (['option_b', 'pilihan_b', 'opsi_b', 'b'].includes(cleanKey)) {
      normalized['option_b'] = val;
    }
    // Option C
    else if (['option_c', 'pilihan_c', 'opsi_c', 'c'].includes(cleanKey)) {
      normalized['option_c'] = val;
    }
    // Option D
    else if (['option_d', 'pilihan_d', 'opsi_d', 'd'].includes(cleanKey)) {
      normalized['option_d'] = val;
    }
    // Correct Answer
    else if (['correct_answer', 'jawaban_benar', 'kunci', 'kunci_jawaban', 'jawaban'].includes(cleanKey)) {
      normalized['correct_answer'] = typeof val === 'string' ? val.trim().toUpperCase() : String(val || '');
    }
    // Subject
    else if (['subject', 'mata_pelajaran', 'mapel', 'topik'].includes(cleanKey)) {
      normalized['subject'] = val;
    }
    // Difficulty
    else if (['difficulty', 'kesulitan', 'tingkat', 'level'].includes(cleanKey)) {
      normalized['difficulty'] = val;
    }
    // Explanation
    else if (['explanation', 'pembahasan', 'penjelasan', 'keterangan'].includes(cleanKey)) {
      normalized['explanation'] = val;
    }
    // Points
    else if (['points', 'poin', 'bobot', 'nilai'].includes(cleanKey)) {
      normalized['points'] = val;
    } else {
      normalized[cleanKey] = val;
    }
  }

  return normalized;
};

/**
 * Parses a CSV buffer or an XLSX buffer into an array of objects.
 */
export const parseRawFileBuffer = (buffer: Buffer, originalFilename: string): Record<string, any>[] => {
  const isCsv = originalFilename.toLowerCase().endsWith('.csv');

  if (isCsv) {
    const csvContent = buffer.toString('utf-8');
    const records = parseCsvSync(csvContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
    return records;
  }

  // Handle XLSX / XLS
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('File spreadsheet tidak memiliki sheet.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const jsonData = XLSX.utils.sheet_to_json<Record<string, any>>(worksheet, {
    raw: false,
    defval: '',
  });

  return jsonData;
};

/**
 * Validates parsed rows row-by-row and produces a comprehensive validation summary.
 */
export const validateParsedRows = (rawRows: Record<string, any>[]): ParseResult => {
  const validRows: (ImportQuestionRow & { rowNumber: number })[] = [];
  const invalidRows: { rowNumber: number; rawData: Record<string, any>; errors: string[] }[] = [];

  rawRows.forEach((row, index) => {
    // Row numbers are 2-indexed in spreadsheet context (Row 1 is headers)
    const rowNumber = index + 2;
    const normalized = normalizeRowKeys(row);

    const parseResult = importQuestionRowSchema.safeParse(normalized);

    if (parseResult.success) {
      validRows.push({
        ...parseResult.data,
        rowNumber,
      });
    } else {
      const errorMessages = parseResult.error.errors.map(
        (err) => `Kolom [${err.path.join('.') || 'data'}]: ${err.message}`
      );
      invalidRows.push({
        rowNumber,
        rawData: row,
        errors: errorMessages,
      });
    }
  });

  return {
    summary: {
      totalRows: rawRows.length,
      validCount: validRows.length,
      invalidCount: invalidRows.length,
    },
    validRows,
    invalidRows,
  };
};

/**
 * Atomic batch commit of valid question rows into Supabase Database.
 */
export const commitImportedQuestions = async (
  questionsToImport: ImportQuestionRow[],
  adminUserId: string
): Promise<{ success: boolean; insertedCount: number; message: string }> => {
  if (questionsToImport.length === 0) {
    return {
      success: false,
      insertedCount: 0,
      message: 'Tidak ada baris soal valid untuk diimpor.',
    };
  }

  // Pre-fetch subjects to link subject_id if matches
  const { data: subjects } = await supabaseAdmin.from('subjects').select('id, name');
  const subjectMap = new Map<string, string>();
  if (subjects) {
    subjects.forEach((s) => subjectMap.set(s.name.toLowerCase().trim(), s.id));
  }

  const recordsToInsert = questionsToImport.map((q) => {
    const subjName = (q.subject || 'Umum').trim();
    const matchedSubjectId = subjectMap.get(subjName.toLowerCase()) || null;

    return {
      question_text: q.question.trim(),
      option_a: q.option_a.trim(),
      option_b: q.option_b.trim(),
      option_c: q.option_c.trim(),
      option_d: q.option_d.trim(),
      correct_answer: q.correct_answer,
      subject_id: matchedSubjectId,
      subject_name: subjName,
      difficulty: q.difficulty,
      explanation: q.explanation?.trim() || null,
      points: q.points || 1,
      created_by: adminUserId,
    };
  });

  // Batch insert into questions table
  const { data, error } = await supabaseAdmin
    .from('questions')
    .insert(recordsToInsert)
    .select('id');

  if (error) {
    console.error('Batch insert questions error:', error);
    throw new Error(`Gagal menyimpan soal ke basis data: ${error.message}`);
  }

  // Log activity
  await supabaseAdmin.from('activity_logs').insert({
    user_id: adminUserId,
    action: 'BULK_IMPORT_QUESTIONS',
    entity_type: 'QUESTIONS',
    details: {
      count: data?.length || recordsToInsert.length,
      timestamp: new Date().toISOString(),
    },
  });

  return {
    success: true,
    insertedCount: data?.length || recordsToInsert.length,
    message: `Berhasil mengimpor ${data?.length || recordsToInsert.length} butir soal ke Bank Soal.`,
  };
};

