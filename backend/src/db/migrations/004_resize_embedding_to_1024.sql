-- Migration 004: resize embedding column from vector(1536) to vector(1024)
-- Reason: switching from OpenAI text-embedding-3-small (1536-d)
--         to BAAI/bge-m3 (1024-d).
--
-- Existing rows have NULL embeddings so no data is lost.
-- We must drop the IVFFlat index first — Postgres cannot alter a column
-- that has a dependent index in place.

-- 1. Drop the old index
DROP INDEX IF EXISTS idx_document_chunks_embedding;

-- 2. Change the column dimension (NULL rows are unaffected)
ALTER TABLE document_chunks
  ALTER COLUMN embedding TYPE vector(1024);

-- 3. Recreate the index for the new dimension using cosine distance
--    (bge-m3 embeddings are normalised, cosine is the correct metric)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
