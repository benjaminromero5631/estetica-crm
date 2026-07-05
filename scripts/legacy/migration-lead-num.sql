-- ============================================================
-- MIGRATION: lead_num secuencial ("Paciente #N") — run in Supabase SQL Editor
-- ============================================================

CREATE SEQUENCE IF NOT EXISTS leads_lead_num_seq;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_num integer;

CREATE OR REPLACE FUNCTION set_lead_num()
RETURNS trigger AS $$
BEGIN
  IF NEW.lead_num IS NULL THEN
    NEW.lead_num := nextval('leads_lead_num_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_lead_num ON leads;
CREATE TRIGGER trg_set_lead_num
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_lead_num();
