import { Request, Response } from 'express';
import pool from '../db/pool';
import { extractPdfText } from '../lib/extractPdf';

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ status: 'error', message: 'No file uploaded' });
    return;
  }

  const { originalname, path: filePath } = req.file;

  // 1. Save document record to DB
  const result = await pool.query<{ id: string; filename: string; created_at: string }>(
    `INSERT INTO documents (filename) VALUES ($1) RETURNING id, filename, created_at`,
    [originalname]
  );
  const doc = result.rows[0];

  // 2. Extract text from the saved PDF (held in memory, not persisted)
  const extracted = await extractPdfText(filePath);

  res.status(201).json({
    status: 'ok',
    message: 'PDF uploaded and text extracted successfully',
    document: {
      id: doc.id,
      filename: doc.filename,
      created_at: doc.created_at,
    },
    extraction: {
      total_pages: extracted.totalPages,
      total_chars: extracted.totalChars,
      pages_preview: extracted.pagesPreviews,
    },
  });
};
