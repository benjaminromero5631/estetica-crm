import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

interface HorarioRow {
  hora_inicio: string
  hora_fin: string
  duracion_bloque: number
}

function generateSlots(horario: HorarioRow): { inicio: string; fin: string }[] {
  const start = toMinutes(horario.hora_inicio)
  const end = toMinutes(horario.hora_fin)
  const step = horario.duracion_bloque
  const slots = []
  for (let t = start; t + step <= end; t += step) {
    slots.push({ inicio: fromMinutes(t), fin: fromMinutes(t + step) })
  }
  return slots
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const fecha = searchParams.get('fecha')
  const sede = searchParams.get('sede') || 'iquique'

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: 'Parámetro fecha requerido (YYYY-MM-DD)' }, { status: 400 })
  }

  const [year, month, day] = fecha.split('-').map(Number)
  const dayOfWeek = new Date(year, month - 1, day).getDay()

  const supabase = serviceClient()

  const { data: profesionales, error: pErr } = await supabase
    .from('profesionales')
    .select('id')
    .eq('activo', true)
    .limit(1)

  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 })

  const profesional_id = profesionales?.[0]?.id ?? null

  if (!profesional_id) {
    return NextResponse.json({ slots: [], profesional_id: null })
  }

  // Sedes distintas de 'iquique' requieren un viaje activo que cubra la fecha,
  // ya que la profesional solo esta ahi de forma esporadica.
  let viaje: { id: string; fecha_inicio: string; fecha_fin: string; cupo_maximo: number } | null = null
  if (sede !== 'iquique') {
    const { data: viajes, error: vErr } = await supabase
      .from('viajes_sede')
      .select('id, fecha_inicio, fecha_fin, cupo_maximo')
      .eq('profesional_id', profesional_id)
      .eq('sede', sede)
      .eq('activo', true)
      .lte('fecha_inicio', fecha)
      .gte('fecha_fin', fecha)
      .maybeSingle()

    if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })
    if (!viajes) return NextResponse.json({ slots: [], profesional_id })
    viaje = viajes
  }

  const [{ data: bloqueo, error: bErr }, { data: horarios, error: hErr }, { data: citas, error: cErr }] =
    await Promise.all([
      supabase
        .from('bloqueos_horario')
        .select('id')
        .eq('profesional_id', profesional_id)
        .eq('sede', sede)
        .eq('fecha', fecha)
        .maybeSingle(),
      supabase
        .from('horarios_disponibles')
        .select('hora_inicio, hora_fin, duracion_bloque')
        .eq('profesional_id', profesional_id)
        .eq('sede', sede)
        .eq('dia_semana', dayOfWeek)
        .eq('activo', true),
      // Ocupacion de la profesional: se chequea en TODAS las sedes, ya que es
      // la misma persona y no puede tener dos citas simultaneas.
      supabase
        .from('citas')
        .select('hora_inicio')
        .eq('profesional_id', profesional_id)
        .eq('fecha', fecha)
        .is('eliminado_at', null),
    ])

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })
  if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 })
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  if (bloqueo) {
    return NextResponse.json({ slots: [], profesional_id })
  }

  if (viaje) {
    const { count, error: countErr } = await supabase
      .from('citas')
      .select('id', { count: 'exact', head: true })
      .eq('profesional_id', profesional_id)
      .eq('sede', sede)
      .gte('fecha', viaje.fecha_inicio)
      .lte('fecha', viaje.fecha_fin)
      .is('eliminado_at', null)
      .neq('estado', 'cancelada')

    if (countErr) return NextResponse.json({ error: countErr.message }, { status: 500 })
    if ((count ?? 0) >= viaje.cupo_maximo) {
      return NextResponse.json({ slots: [], profesional_id })
    }
  }

  const ocupados = new Set((citas ?? []).map((c: { hora_inicio: string }) => c.hora_inicio))
  const allSlots = (horarios ?? []).flatMap((h: HorarioRow) => generateSlots(h))
  const slots = allSlots.filter(s => !ocupados.has(s.inicio))

  return NextResponse.json({ slots, profesional_id })
}
