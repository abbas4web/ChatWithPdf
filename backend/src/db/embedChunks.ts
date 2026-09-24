import pool from './pool';
import { embedText } from '../lib/embedText';

/**
 * Backfill script — generates and saves embeddings for every
 * document_chunks row where embedding IS NULL.
 *
 * Safe to re-run: it only touches NULL rows, so already-embedded
 * chunks are never overwritten.
 */
async function run(): Promise<void> {
  const client = await pool.connect();
  try {
    // Fetch only un-embedded chunks
    const { rows } = await client.query<{ id: string; content: string }>(
      `SELECT id, content
       FROM document_chunks
       WHERE embedding IS NULL
       ORDER BY created_at, chunk_index`
    );

    if (rows.length === 0) {
      console.log('[embedChunks] No chunks need embedding — all up to date.');
      return;
    }

    console.log(`[embedChunks] Found ${rows.length} chunk(s) to embed.`);

    let done = 0;
    for (const row of rows) {
      const embedding = await embedText(row.content);

      // pgvector expects the vector as a string like '[0.1, 0.2, ...]'
      const vectorLiteral = `[${embedding.join(',')}]`;

      await client.query(
        `UPDATE document_chunks SET embedding = $1 WHERE id = $2`,
        [vectorLiteral, row.id]
      );

      done++;
      console.log(`[embedChunks] ${done}/${rows.length} — chunk ${row.id} embedded.`);
    }

    console.log(`[embedChunks] Done. ${done} chunk(s) embedded successfully.`);
  } finally {
    client.release();
    await pool.end();
  }
}

run().catch(err => {
  console.error('[embedChunks] Failed:', err.message);
  process.exit(1);
});
