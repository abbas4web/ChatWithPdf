import { Request, Response } from 'express';
import pool from '../db/pool';
import { extractPdfText } from '../lib/extractPdf';
import { chunkText } from '../lib/chunkText';
import { embedText } from '../lib/embedText';

const CHUNK_SIZE    = 500; // characters per chunk
const OVERLAP       = 100; // overlapping characters between consecutive chunks
const PREVIEW_COUNT = 3;   // sample chunks returned in the response

export const uploadDocument = async (req: Request, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ status: 'error', message: 'No file uploaded' });
    return;
  }

  const { originalname, path: filePath } = req.file;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Insert document record
    const docResult = await client.query<{ id: string; filename: string; created_at: string }>(
      `INSERT INTO documents (filename) VALUES ($1) RETURNING id, filename, created_at`,
      [originalname]
    );
    const doc = docResult.rows[0];

    // 2. Extract full text
    const extracted = await extractPdfText(filePath);

    // 3. Split into overlapping chunks
    const chunks = chunkText(extracted.fullText, { chunkSize: CHUNK_SIZE, overlap: OVERLAP });

    // 4. Generate embedding for each chunk and insert with embedding
    for (const chunk of chunks) {
      const embedding = await embedText(chunk.text);
      const vectorLiteral = `[${embedding.join(',')}]`;

      await client.query(
        `INSERT INTO document_chunks (document_id, chunk_index, content, embedding)
         VALUES ($1, $2, $3, $4)`,
        [doc.id, chunk.index, chunk.text, vectorLiteral]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      status: 'ok',
      message: 'PDF uploaded, extracted, chunked, embedded, and saved successfully',
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
        sample_chunks: chunks.slice(0, PREVIEW_COUNT).map(c => ({
          index: c.index,
          char_start: c.charStart,
          char_end: c.charEnd,
          text: c.text,
        })),
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};
