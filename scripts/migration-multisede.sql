-- ============================================================
-- MIGRATION: Multi-sede (horarios, bloqueos, citas) + viajes_sede
-- Correr en Supabase SQL Editor. 100% idempotente.
-- ============================================================

-- 1. Columna sede en las tablas existentes
ALTER TABLE horarios_disponibles ADD COLUMN IF NOT EXISTS sede text NOT NULL DEFAULT 'iquique';
ALTER TABLE bloqueos_horario     ADD COLUMN IF NOT EXISTS sede text NOT NULL DEFAULT 'iquique';
ALTER TABLE citas                ADD COLUMN IF NOT EXISTS sede text NOT NULL DEFAULT 'iquique';

-- 2. Tabla de viajes a otras sedes
CREATE TABLE IF NOT EXISTS viajes_sede (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id  uuid REFERENCES profesionales(id),
  sede            text NOT NULL,
  fecha_inicio    date NOT NULL,
  fecha_fin       date NOT NULL,
  cupo_maximo     integer NOT NULL,
  activo          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE viajes_sede ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'viajes_sede' AND policyname = 'authenticated_select_viajes'
  ) THEN
    CREATE POLICY "authenticated_select_viajes" ON viajes_sede FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'viajes_sede' AND policyname = 'authenticated_insert_viajes'
  ) THEN
    CREATE POLICY "authenticated_insert_viajes" ON viajes_sede FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'viajes_sede' AND policyname = 'authenticated_update_viajes'
  ) THEN
    CREATE POLICY "authenticated_update_viajes" ON viajes_sede FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'viajes_sede' AND policyname = 'authenticated_delete_viajes'
  ) THEN
    CREATE POLICY "authenticated_delete_viajes" ON viajes_sede FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;
