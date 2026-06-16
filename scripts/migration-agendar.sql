-- ============================================================
-- MIGRATION: Página pública de agendamiento
-- Correr en Supabase SQL Editor
-- ============================================================

-- 1. Tabla profesionales
CREATE TABLE IF NOT EXISTS profesionales (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nombre text NOT NULL,
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profesionales' AND policyname = 'anon_read'
  ) THEN
    CREATE POLICY "anon_read" ON profesionales FOR SELECT USING (true);
  END IF;
END $$;

-- Seed: un profesional por defecto
INSERT INTO profesionales (nombre, activo)
VALUES ('Profesional 1', true)
ON CONFLICT DO NOTHING;

-- 2. Tabla horarios_disponibles
CREATE TABLE IF NOT EXISTS horarios_disponibles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  dia_semana int NOT NULL,  -- 0=domingo, 1=lunes, ..., 6=sabado
  hora_inicio time NOT NULL,
  hora_fin time NOT NULL,
  duracion_bloque int NOT NULL DEFAULT 60,  -- minutos
  activo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE horarios_disponibles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'horarios_disponibles' AND policyname = 'anon_read'
  ) THEN
    CREATE POLICY "anon_read" ON horarios_disponibles FOR SELECT USING (true);
  END IF;
END $$;

-- Seed: lunes a viernes 09:00–18:00, bloques de 60 min
INSERT INTO horarios_disponibles (dia_semana, hora_inicio, hora_fin, duracion_bloque)
VALUES
  (1, '09:00', '18:00', 60),
  (2, '09:00', '18:00', 60),
  (3, '09:00', '18:00', 60),
  (4, '09:00', '18:00', 60),
  (5, '09:00', '18:00', 60);

-- 3. Agregar columnas a citas para el agendamiento público
ALTER TABLE citas ADD COLUMN IF NOT EXISTS fecha date;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS hora_inicio time;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS hora_fin time;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS pago_confirmado boolean DEFAULT false;
ALTER TABLE citas ADD COLUMN IF NOT EXISTS profesional_id uuid REFERENCES profesionales(id) ON DELETE SET NULL;

-- La policy existente "service_role_all" FOR ALL USING (true) ya cubre anon.
-- Si falla el insert anon, agregar esta policy:
-- CREATE POLICY "anon_insert" ON citas FOR INSERT WITH CHECK (true);
-- CREATE POLICY "anon_select" ON citas FOR SELECT USING (true);
