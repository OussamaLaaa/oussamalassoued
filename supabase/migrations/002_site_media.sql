-- 002_site_media.sql
-- Phase 1: Create site_media table for uploaded file metadata.
-- Do NOT run this file directly — review first.

CREATE TABLE site_media (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name      TEXT NOT NULL,
  storage_path   TEXT NOT NULL,
  public_url     TEXT DEFAULT NULL,
  bucket         TEXT NOT NULL DEFAULT 'site-media',
  content_type   TEXT NOT NULL,
  size_bytes     BIGINT,
  section        TEXT DEFAULT NULL,
  linked_item_id TEXT DEFAULT NULL,
  alt_text       TEXT DEFAULT NULL,
  title          TEXT DEFAULT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_site_media_storage_path ON site_media (storage_path);
CREATE INDEX idx_site_media_section ON site_media (section);
CREATE INDEX idx_site_media_created_at ON site_media (created_at DESC);

CREATE OR REPLACE FUNCTION update_site_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_site_media_updated_at
  BEFORE UPDATE ON site_media
  FOR EACH ROW
  EXECUTE FUNCTION update_site_media_updated_at();

ALTER TABLE site_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_can_read_site_media"
  ON site_media
  FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies in Phase 1.
-- All writes go through the server API using the service role key.
-- Authenticated user policies will be added in Phase 3.
