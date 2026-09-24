-- Migration 003: add embedding column to document_chunks
-- Uses pgvector's vector type with 1536 dimensions to match
-- OpenAI text-embedding-3-small output size.

ALTER TABLE document_chunks
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- IVFFlat index for fast approximate nearest-neighbour search.
-- Created with cosine distance (same metric OpenAI embeddings are optimised for).
-- The index is defined now but will only become useful once embeddings are populated.
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
  ON document_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
