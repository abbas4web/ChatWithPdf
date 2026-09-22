import { Request, Response } from 'express';
import pool from '../db/pool';
import { extractPdfText } from '../lib/extractPdf';
import { chunkText } from '../lib/chunkText';

const CHUNK_SIZE = 500;  // characters per chunk
const OVERLAP    = 100;  // overlapping characters between consecutive chunks
const PREVIEW_COUNT = 3; // how many sample chunks to include in the response

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

  // 2. Extract full text from the saved PDF
  const extracted = await extractPdfText(filePath);

  // 3. Split into overlapping fixed-size chunks (held in memory, not persisted yet)
  const chunks = chunkText(extracted.fullText, { chunkSize: CHUNK_SIZE, overlap: OVERLAP });

  res.status(201).json({
    status: 'ok',
    message: 'PDF uploaded, text extracted, and chunked successfully',
    document: {
      id: doc.id,
      filename: doc.filename,
      created_at: doc.created_at,
    },
    extraction: {
      total_pages: extracted.totalPages,
      total_chars: extracted.totalChars,
    },
    chunking: {
      chunk_size: CHUNK_SIZE,
      overlap: OVERLAP,
      total_chunks: chunks.length,
      // Return first PREVIEW_COUNT chunks for inspection
      sample_chunks: chunks.slice(0, PREVIEW_COUNT).map(c => ({
        index: c.index,
        char_start: c.charStart,
        char_end: c.charEnd,
        text: c.text,
      })),
    },
  });
};
