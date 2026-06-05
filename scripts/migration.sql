-- ============================================================
-- MIGRATION: Zeltra CRM — run in Supabase SQL Editor
-- ============================================================

-- 1. New columns on leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS deposito_pagado boolean DEFAULT false;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS fecha_cita timestamptz;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS ultima_vez_clinica text;

-- 2. Replace pipeline stages
DELETE FROM etapas_config;
INSERT INTO etapas_config (nombre, slug, orden, color) VALUES
  ('Nuevo Lead',          'nuevo',                 1, '#6366f1'),
  ('Contactado',          'contactado',            2, '#f59e0b'),
  ('Interesado',          'interesado',            3, '#3b82f6'),
  ('Cita Agendada',       'cita_agendada',         4, '#8b5cf6'),
  ('Reserva c/ Deposito', 'reserva_con_deposito',  5, '#10b981'),
  ('Perdido',             'perdido',               6, '#ef4444');

-- 3. Update get_metricas() — conversion event = reserva_con_deposito
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

    -- Conversion = reserva_con_deposito (Zeltra billing event)
    'total_convertidos', COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito'),
    'convertidos_este_mes', COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito' AND convertido_at >= date_trunc('month', now())),
    'convertidos_esta_semana', COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito' AND convertido_at >= date_trunc('week', now())),
    'convertidos_mes_anterior', COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito' AND
      convertido_at >= date_trunc('month', now() - interval '1 month') AND
      convertido_at < date_trunc('month', now())),
    'tasa_conversion', ROUND(COUNT(*) FILTER (WHERE etapa = 'reserva_con_deposito') * 100.0 / NULLIF(COUNT(*), 0), 1),

    -- Revenue
    'facturado_total', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito'), 0),
    'facturado_este_mes', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito' AND convertido_at >= date_trunc('month', now())), 0),
    'facturado_esta_semana', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito' AND convertido_at >= date_trunc('week', now())), 0),
    'facturado_mes_anterior', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito' AND
      convertido_at >= date_trunc('month', now() - interval '1 month') AND
      convertido_at < date_trunc('month', now())), 0),
    'valor_en_pipeline', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa NOT IN ('reserva_con_deposito','perdido')), 0),
    'valor_perdido', COALESCE(SUM(valor_estimado) FILTER (WHERE etapa = 'perdido'), 0),
    'ticket_promedio', COALESCE(ROUND(AVG(valor_estimado) FILTER (WHERE etapa = 'reserva_con_deposito'), 0), 0),

    -- Pipeline
    'leads_perdidos', COUNT(*) FILTER (WHERE etapa = 'perdido'),
    'tasa_perdidos', ROUND(COUNT(*) FILTER (WHERE etapa = 'perdido') * 100.0 / NULLIF(COUNT(*), 0), 1),
    'leads_en_pipeline', COUNT(*) FILTER (WHERE etapa NOT IN ('reserva_con_deposito','perdido')),

    -- Per stage
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

    -- Top services
    'top_servicios', (
      SELECT json_agg(json_build_object('servicio', servicio_interes, 'count', cnt, 'valor', val))
      FROM (
        SELECT servicio_interes, COUNT(*) as cnt, SUM(valor_estimado) as val
        FROM leads WHERE servicio_interes IS NOT NULL AND etapa = 'reserva_con_deposito'
        GROUP BY servicio_interes ORDER BY cnt DESC LIMIT 5
      ) s
    ),

    -- Top sources
    'top_fuentes', (
      SELECT json_agg(json_build_object('fuente', fuente, 'count', cnt))
      FROM (
        SELECT fuente, COUNT(*) as cnt FROM leads
        WHERE fuente IS NOT NULL
        GROUP BY fuente ORDER BY cnt DESC LIMIT 4
      ) f
    ),

    -- Monthly trend (last 6 months)
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
