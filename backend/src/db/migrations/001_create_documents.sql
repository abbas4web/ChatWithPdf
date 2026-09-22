-- Migration 001: create documents table
CREATE TABLE IF NOT EXISTS documents (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  filename   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
