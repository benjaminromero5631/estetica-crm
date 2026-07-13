-- ============================================================
-- SCHEMA MASTER — Estetica CRM
-- Correr una sola vez en Supabase SQL Editor para un cliente nuevo.
-- Reconstruye exactamente el estado verificado en produccion via
-- information_schema.columns + pg_constraint (ver historial de chat).
--
-- PENDIENTE — no incluido porque no esta documentado en el repo,
-- confirmar con el autor original antes de asumir nada:
--   1. Tabla lead_historial — existe en produccion con FK a leads,
--      pero ningun codigo de la app ni script la escribe, y no hay
--      policies confirmadas para ella. Probablemente hay un trigger
--      en leads (on etapa change) no documentado.
-- ============================================================

create extension if not exists pgcrypto;

-- ============================================================
-- 1. TABLAS
-- ============================================================

CREATE TABLE profesionales (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre        text NOT NULL,
  especialidad  text,
  activo        boolean DEFAULT true,
  created_at    timestamptz DEFAULT now(),
  auth_user_id  uuid REFERENCES auth.users(id)
);

CREATE TABLE etapas_config (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre      text NOT NULL,
  slug        text NOT NULL UNIQUE,
  orden       integer NOT NULL,
  color       text NOT NULL,
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre              text NOT NULL,
  telefono            text NOT NULL,
  email               text,
  servicio_interes    text,
  fuente              text DEFAULT 'manual',
  etapa               text DEFAULT 'nuevo',
  notas               text,
  valor_estimado      numeric DEFAULT 0,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now(),
  convertido_at       timestamptz,
  deposito_pagado     boolean DEFAULT false,
  fecha_cita          timestamptz,
  ultima_vez_clinica  text,
  lead_num            integer,
  eliminado_at        timestamptz
);

CREATE TABLE citas (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id           uuid REFERENCES leads(id) ON DELETE SET NULL,
  profesional_id    uuid REFERENCES profesionales(id) ON DELETE SET NULL,
  fecha             date NOT NULL,
  hora_inicio       time NOT NULL,
  hora_fin          time NOT NULL,
  estado            text DEFAULT 'pendiente'
                      CHECK (estado = ANY (ARRAY['pendiente', 'confirmada', 'completada', 'cancelada'])),
  pago_confirmado   boolean DEFAULT false,
  pago_referencia   text,
  created_at        timestamptz DEFAULT now(),
  titulo            text,
  notas             text,
  servicio          text,
  updated_at        timestamptz DEFAULT now(),
  eliminado_at      timestamptz,
  sede              text NOT NULL DEFAULT 'iquique'
);

CREATE TABLE bloqueos_horario (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id  uuid NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
  fecha           date NOT NULL,
  motivo          text,
  created_at      timestamptz DEFAULT now(),
  sede            text NOT NULL DEFAULT 'iquique'
);

CREATE TABLE horarios_disponibles (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id    uuid REFERENCES profesionales(id) ON DELETE CASCADE,
  dia_semana        integer NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio       time NOT NULL,
  hora_fin          time NOT NULL,
  duracion_bloque   integer DEFAULT 45,
  activo            boolean DEFAULT true,
  sede              text NOT NULL DEFAULT 'iquique'
);

CREATE TABLE viajes_sede (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profesional_id  uuid REFERENCES profesionales(id),
  sede            text NOT NULL,
  fecha_inicio    date NOT NULL,
  fecha_fin       date NOT NULL,
  cupo_maximo     integer NOT NULL,
  activo          boolean DEFAULT true,
  created_at      timestamptz DEFAULT now()
);

-- PENDIENTE: contenido/trigger que llena esta tabla no documentado (ver nota arriba).
CREATE TABLE lead_historial (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id         uuid REFERENCES leads(id) ON DELETE CASCADE,
  etapa_anterior  text,
  etapa_nueva     text NOT NULL,
  created_at      timestamptz DEFAULT now()
);

CREATE TABLE metricas_mensuales (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mes                   character NOT NULL UNIQUE,
  mes_label             text NOT NULL,
  total_leads           integer NOT NULL DEFAULT 0,
  total_reservas        integer NOT NULL DEFAULT 0,
  tasa_conversion       numeric NOT NULL DEFAULT 0,
  facturado             integer NOT NULL DEFAULT 0,
  ticket_promedio       integer NOT NULL DEFAULT 0,
  performance_zeltra    integer NOT NULL DEFAULT 0,
  leads_perdidos        integer NOT NULL DEFAULT 0,
  created_at            timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. INDICES (soft delete — scripts/migration-soft-delete.sql)
-- ============================================================

CREATE INDEX idx_leads_eliminado_at ON leads (eliminado_at) WHERE eliminado_at IS NULL;
CREATE INDEX idx_citas_eliminado_at ON citas (eliminado_at) WHERE eliminado_at IS NULL;

-- ============================================================
-- 3. lead_num secuencial (scripts/migration-lead-num.sql)
-- ============================================================

CREATE SEQUENCE leads_lead_num_seq;

CREATE OR REPLACE FUNCTION set_lead_num()
RETURNS trigger AS $$
BEGIN
  IF NEW.lead_num IS NULL THEN
    NEW.lead_num := nextval('leads_lead_num_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_lead_num
  BEFORE INSERT ON leads
  FOR EACH ROW
  EXECUTE FUNCTION set_lead_num();

-- ============================================================
-- 4. RLS + policies (scripts/rls-policies.sql, migration.sql, migration-agendar.sql)
-- ============================================================

ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_select_leads" ON leads FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_leads" ON leads FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_leads" ON leads FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_leads" ON leads FOR DELETE USING (auth.uid() IS NOT NULL);

ALTER TABLE etapas_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_select_etapas" ON etapas_config FOR SELECT USING (auth.uid() IS NOT NULL);

ALTER TABLE citas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON citas FOR ALL USING (true);

ALTER TABLE metricas_mensuales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_all" ON metricas_mensuales FOR ALL USING (true);

ALTER TABLE profesionales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON profesionales FOR SELECT USING (true);

ALTER TABLE horarios_disponibles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read" ON horarios_disponibles FOR SELECT USING (true);

ALTER TABLE bloqueos_horario ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_select_bloqueos" ON bloqueos_horario FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_bloqueos" ON bloqueos_horario FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_bloqueos" ON bloqueos_horario FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_bloqueos" ON bloqueos_horario FOR DELETE USING (auth.uid() IS NOT NULL);

ALTER TABLE viajes_sede ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated_select_viajes" ON viajes_sede FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_insert_viajes" ON viajes_sede FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_update_viajes" ON viajes_sede FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "authenticated_delete_viajes" ON viajes_sede FOR DELETE USING (auth.uid() IS NOT NULL);

-- PENDIENTE: no hay policies confirmadas para lead_historial.
-- Se deja RLS activado sin policies (bloquea todo excepto service_role) como
-- default seguro hasta confirmar el criterio real.
ALTER TABLE lead_historial ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. Trigger updated_at en citas (scripts/migration.sql)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER citas_updated_at
  BEFORE UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. Funciones de metricas (scripts/migration.sql)
-- ============================================================

CREATE OR REPLACE FUNCTION get_metricas()
RETURNS json AS $$
DECLARE result json;
BEGIN
  SELECT json_build_object(
    'total_leads', COUNT(*),
    'leads_este_mes', COUNT(*) FILTER (WHERE created_at >= date_trunc('month', now())),
    'leads_esta_semana', COUNT(*) FILTER (WHERE created_at >= date_trunc('week', now())),
    'leads_hoy', COUNT(*) FILTER (WHERE created_at >= date_trunc('day', now())),
    'leads_mes_anterior', COUNT(*) FILTER (WHERE
      created_at >= date_trunc('month', now() - interval '1 month') AND
      created_at < date_trunc('month', now())),

    'total_convertidos', COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito'),
    'convertidos_este_mes', COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito' AND convertido_at >= date_trunc('month', now())),
    'convertidos_esta_semana', COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito' AND convertido_at >= date_trunc('week', now())),
    'convertidos_mes_anterior', COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito' AND
      convertido_at >= date_trunc('month', now() - interval '1 month') AND
      convertido_at < date_trunc('month', now())),
    'tasa_conversion', ROUND(COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito') * 100.0 / NULLIF(COUNT(*), 0), 1),

    'facturado_total', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito'), 0),
    'facturado_este_mes', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito' AND convertido_at >= date_trunc('month', now())), 0),
    'facturado_esta_semana', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito' AND convertido_at >= date_trunc('week', now())), 0),
    'facturado_mes_anterior', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito' AND
      convertido_at >= date_trunc('month', now() - interval '1 month') AND
      convertido_at < date_trunc('month', now())), 0),
    'valor_en_pipeline', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa NOT IN ('reserva_con_deposito','perdido')), 0),
    'valor_perdido', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'perdido'), 0),
    'ticket_promedio', COALESCE(ROUND(AVG(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito'), 0), 0),

    'leads_perdidos', COUNT(*) FILTER (WHERE etapa = 'perdido'),
    'tasa_perdidos', ROUND(COUNT(*) FILTER (WHERE etapa = 'perdido') * 100.0 / NULLIF(COUNT(*), 0), 1),
    'leads_en_pipeline', COUNT(*) FILTER (WHERE etapa NOT IN ('reserva_con_deposito','perdido')),

    'leads_por_etapa', (
      SELECT json_agg(json_build_object(
        'etapa', e.slug, 'nombre', e.nombre, 'color', e.color,
        'count', COALESCE(l.cnt, 0), 'valor', COALESCE(l.val, 0)
      ) ORDER BY e.orden)
      FROM etapas_config e
      LEFT JOIN (
        SELECT etapa, COUNT(*) as cnt, SUM(valor_estimado) as val
        FROM leads GROUP BY etapa
      ) l ON l.etapa = e.slug
    ),

    'top_servicios', (
      SELECT json_agg(json_build_object('servicio', servicio_interes, 'count', cnt, 'valor', val))
      FROM (
        SELECT servicio_interes, COUNT(*) as cnt, SUM(valor_estimado) as val
        FROM leads WHERE servicio_interes IS NOT NULL AND etapa = 'reserva_con_deposito'
        GROUP BY servicio_interes ORDER BY cnt DESC LIMIT 5
      ) s
    ),

    'top_fuentes', (
      SELECT json_agg(json_build_object('fuente', fuente, 'count', cnt))
      FROM (
        SELECT fuente, COUNT(*) as cnt FROM leads
        WHERE fuente IS NOT NULL
        GROUP BY fuente ORDER BY cnt DESC LIMIT 4
      ) f
    ),

    'tendencia_mensual', (
      SELECT json_agg(json_build_object(
        'mes', to_char(mes, 'Mon YY'),
        'leads', COALESCE(l.cnt, 0),
        'convertidos', COALESCE(l.conv, 0),
        'facturado', COALESCE(l.rev, 0)
      ) ORDER BY mes)
      FROM generate_series(
        date_trunc('month', now() - interval '5 months'),
        date_trunc('month', now()), '1 month'::interval
      ) mes
      LEFT JOIN (
        SELECT date_trunc('month', created_at) as m,
          COUNT(*) as cnt,
          COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito') as conv,
          SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito') as rev
        FROM leads GROUP BY m
      ) l ON l.m = mes
    )
  ) INTO result FROM leads;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION guardar_snapshot_mensual()
RETURNS json AS $$
DECLARE
  mes_actual text := to_char(now() - interval '1 month', 'YYYY-MM');
  mes_lbl text := initcap(to_char(now() - interval '1 month', 'TMMonth YYYY'));
  snap json;
BEGIN
  INSERT INTO metricas_mensuales (
    mes, mes_label, total_leads, total_reservas,
    tasa_conversion, facturado, ticket_promedio,
    performance_zeltra, leads_perdidos
  )
  SELECT
    mes_actual,
    mes_lbl,
    COUNT(*) as total_leads,
    COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito') as total_reservas,
    ROUND(COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito') * 100.0 / NULLIF(COUNT(*), 0), 1),
    COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito'), 0),
    COALESCE(ROUND(AVG(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito'), 0), 0),
    COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito') * 15000,
    COUNT(*) FILTER (WHERE etapa = 'perdido')
  FROM leads
  WHERE created_at >= date_trunc('month', now() - interval '1 month')
    AND created_at < date_trunc('month', now())
  ON CONFLICT (mes) DO UPDATE SET
    total_leads = EXCLUDED.total_leads,
    total_reservas = EXCLUDED.total_reservas,
    tasa_conversion = EXCLUDED.tasa_conversion,
    facturado = EXCLUDED.facturado,
    ticket_promedio = EXCLUDED.ticket_promedio,
    performance_zeltra = EXCLUDED.performance_zeltra,
    leads_perdidos = EXCLUDED.leads_perdidos;

  SELECT row_to_json(m) INTO snap FROM metricas_mensuales m WHERE mes = mes_actual;
  RETURN snap;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 7. Seeds (scripts/migration.sql, scripts/migration-agendar.sql)
-- ============================================================

INSERT INTO etapas_config (nombre, slug, orden, color) VALUES
  ('Nuevo Lead',          'nuevo',                 1, '#6366f1'),
  ('Contactado',          'contactado',            2, '#f59e0b'),
  ('Interesado',          'interesado',            3, '#3b82f6'),
  ('Cita Agendada',       'cita_agendada',         4, '#8b5cf6'),
  ('Reserva c/ Deposito', 'reserva_con_deposito',  5, '#10b981'),
  ('Perdido',             'perdido',               6, '#ef4444');

INSERT INTO profesionales (nombre, activo)
VALUES ('Profesional 1', true);

INSERT INTO horarios_disponibles (dia_semana, hora_inicio, hora_fin, duracion_bloque)
VALUES
  (1, '09:00', '18:00', 60),
  (2, '09:00', '18:00', 60),
  (3, '09:00', '18:00', 60),
  (4, '09:00', '18:00', 60),
  (5, '09:00', '18:00', 60);
