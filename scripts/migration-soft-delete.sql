-- ============================================================
-- MIGRATION: Borrado seguro (soft delete) — run in Supabase SQL Editor
-- ============================================================

ALTER TABLE leads ADD COLUMN IF NOT EXISTS eliminado_at timestamptz;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS eliminado_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_leads_eliminado_at ON leads (eliminado_at) WHERE eliminado_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_citas_eliminado_at ON citas (eliminado_at) WHERE eliminado_at IS NULL;
