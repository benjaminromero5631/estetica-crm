-- Run this in Supabase Dashboard → SQL Editor

-- leads table
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_leads" ON leads;
DROP POLICY IF EXISTS "authenticated_select_leads" ON leads;
DROP POLICY IF EXISTS "authenticated_insert_leads" ON leads;
DROP POLICY IF EXISTS "authenticated_update_leads" ON leads;
DROP POLICY IF EXISTS "authenticated_delete_leads" ON leads;

CREATE POLICY "authenticated_select_leads" ON leads
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_insert_leads" ON leads
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_update_leads" ON leads
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "authenticated_delete_leads" ON leads
  FOR DELETE USING (auth.uid() IS NOT NULL);


-- etapas_config table
ALTER TABLE etapas_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_all_etapas" ON etapas_config;
DROP POLICY IF EXISTS "authenticated_select_etapas" ON etapas_config;

CREATE POLICY "authenticated_select_etapas" ON etapas_config
  FOR SELECT USING (auth.uid() IS NOT NULL);
