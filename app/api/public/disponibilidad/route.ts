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

  const [{ data: bloqueo, error: bErr }, { data: horarios, error: hErr }, { data: citas, error: cErr }] =
    await Promise.all([
      supabase
        .from('bloqueos_horario')
        .select('id')
        .eq('profesional_id', profesional_id)
        .eq('fecha', fecha)
        .maybeSingle(),
      supabase
        .from('horarios_disponibles')
        .select('hora_inicio, hora_fin, duracion_bloque')
        .eq('profesional_id', profesional_id)
        .eq('dia_semana', dayOfWeek)
        .eq('activo', true),
      supabase
        .from('citas')
        .select('hora_inicio')
        .eq('fecha', fecha),
    ])

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })
  if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 })
  if (cErr) return NextResponse.json({ error: cErr.message }, { status: 500 })

  if (bloqueo) {
    return NextResponse.json({ slots: [], profesional_id })
  }

  const ocupados = new Set((citas ?? []).map((c: { hora_inicio: string }) => c.hora_inicio))
  const allSlots = (horarios ?? []).flatMap((h: HorarioRow) => generateSlots(h))
  const slots = allSlots.filter(s => !ocupados.has(s.inicio))

  return NextResponse.json({ slots, profesional_id })
}
