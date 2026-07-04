-- ============================================================
-- MIGRATION: Horarios por profesional + bloqueos puntuales
-- Correr en Supabase SQL Editor
-- ============================================================

-- 1. Vincular profesionales a usuarios de Auth (sin datos, solo columna)
ALTER TABLE profesionales ADD COLUMN IF NOT EXISTS auth_user_id uuid REFERENCES auth.users(id);

-- 2. horarios_disponibles ahora es por profesional
ALTER TABLE horarios_disponibles ADD COLUMN IF NOT EXISTS profesional_id uuid REFERENCES profesionales(id) ON DELETE CASCADE;

-- Policies de horarios_disponibles para que el profesional autenticado pueda gestionar su propio horario
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'horarios_disponibles' AND policyname = 'authenticated_insert_horarios'
  ) THEN
    CREATE POLICY "authenticated_insert_horarios" ON horarios_disponibles FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'horarios_disponibles' AND policyname = 'authenticated_update_horarios'
  ) THEN
    CREATE POLICY "authenticated_update_horarios" ON horarios_disponibles FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'horarios_disponibles' AND policyname = 'authenticated_delete_horarios'
  ) THEN
    CREATE POLICY "authenticated_delete_horarios" ON horarios_disponibles FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 3. Tabla de bloqueos puntuales (vacaciones, dias libres, etc)
CREATE TABLE IF NOT EXISTS bloqueos_horario (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profesional_id uuid NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  fecha date NOT NULL,
  motivo text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE bloqueos_horario ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bloqueos_horario' AND policyname = 'authenticated_select_bloqueos'
  ) THEN
    CREATE POLICY "authenticated_select_bloqueos" ON bloqueos_horario FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bloqueos_horario' AND policyname = 'authenticated_insert_bloqueos'
  ) THEN
    CREATE POLICY "authenticated_insert_bloqueos" ON bloqueos_horario FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bloqueos_horario' AND policyname = 'authenticated_update_bloqueos'
  ) THEN
    CREATE POLICY "authenticated_update_bloqueos" ON bloqueos_horario FOR UPDATE USING (auth.uid() IS NOT NULL);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bloqueos_horario' AND policyname = 'authenticated_delete_bloqueos'
  ) THEN
    CREATE POLICY "authenticated_delete_bloqueos" ON bloqueos_horario FOR DELETE USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- NOTA: la vinculacion profesionales.auth_user_id se hace manualmente despues
-- de crear los usuarios de Auth (UPDATE profesionales SET auth_user_id = '...' WHERE id = '...').
-- NOTA: los horarios_disponibles existentes (seed lunes-viernes) quedan con profesional_id NULL.
-- Hay que reasignarlos manualmente al profesional correspondiente o recrearlos desde la pantalla /crm/horarios.
