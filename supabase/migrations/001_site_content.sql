 -- 001_site_content.sql
-- Phase 1: Create site_content table for public website config.
-- Do NOT run this file directly — review first.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE site_content (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section    TEXT NOT NULL,
  data       JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public  BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID DEFAULT NULL
);

CREATE UNIQUE INDEX idx_site_content_section ON site_content (section);
CREATE INDEX idx_site_content_data_gin ON site_content USING GIN (data);
CREATE INDEX idx_site_content_is_public ON site_content (is_public);

CREATE OR REPLACE FUNCTION update_site_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_site_content_updated_at();

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_can_read_public_site_content"
  ON site_content
  FOR SELECT
  USING (is_public = true);

-- No INSERT/UPDATE/DELETE policies in Phase 1.
-- All writes go through the server API using the service role key,
-- which bypasses RLS. Authenticated user policies will be added
-- in Phase 3 when Dashboard auth is wired to Supabase Auth.
