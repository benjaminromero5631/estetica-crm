import { createClient } from '@/lib/supabase-server'
import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'

async function getProfesionalId() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', profesionalId: null }

  const svc = serviceClient()
  const { data: profesional, error } = await svc
    .from('profesionales')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) return { error: error.message, profesionalId: null }
  if (!profesional) return { error: 'NO_VINCULADO', profesionalId: null }

  return { error: null, profesionalId: profesional.id as string }
}

export async function GET() {
  const { error, profesionalId } = await getProfesionalId()
  if (error) {
    const status = error === 'NO_VINCULADO' ? 200 : 401
    return NextResponse.json({ error, profesional_id: null, horarios: [] }, { status })
  }

  const svc = serviceClient()
  const { data, error: hErr } = await svc
    .from('horarios_disponibles')
    .select('id, dia_semana, hora_inicio, hora_fin, duracion_bloque, activo')
    .eq('profesional_id', profesionalId)
    .order('dia_semana', { ascending: true })

  if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 })

  return NextResponse.json({ error: null, profesional_id: profesionalId, horarios: data ?? [] })
}

interface DiaInput {
  dia_semana: number
  activo: boolean
  hora_inicio: string
  hora_fin: string
}

export async function PUT(request: Request) {
  const { error, profesionalId } = await getProfesionalId()
  if (error) {
    return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })
  }

  const body = await request.json()
  const dias: DiaInput[] = body.dias

  if (!Array.isArray(dias) || dias.length !== 7) {
    return NextResponse.json({ error: 'Se requieren los 7 dias de la semana' }, { status: 400 })
  }

  const svc = serviceClient()

  const { error: delErr } = await svc
    .from('horarios_disponibles')
    .delete()
    .eq('profesional_id', profesionalId)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  const rows = dias
    .filter(d => d.activo)
    .map(d => ({
      profesional_id: profesionalId,
      dia_semana: d.dia_semana,
      hora_inicio: d.hora_inicio,
      hora_fin: d.hora_fin,
      duracion_bloque: 60,
      activo: true,
    }))

  if (rows.length > 0) {
    const { error: insErr } = await svc.from('horarios_disponibles').insert(rows)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
