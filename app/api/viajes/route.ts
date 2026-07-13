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
    return NextResponse.json({ error, viajes: [] }, { status })
  }

  const svc = serviceClient()
  const { data, error: vErr } = await svc
    .from('viajes_sede')
    .select('id, sede, fecha_inicio, fecha_fin, cupo_maximo, activo, created_at')
    .eq('profesional_id', profesionalId)
    .order('fecha_inicio', { ascending: false })

  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })

  return NextResponse.json({ error: null, viajes: data ?? [] })
}

export async function POST(request: Request) {
  const { error, profesionalId } = await getProfesionalId()
  if (error) return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })

  const body = await request.json()
  const sede: string = body.sede
  const fecha_inicio: string = body.fecha_inicio
  const fecha_fin: string = body.fecha_fin
  const cupo_maximo: number = Number(body.cupo_maximo)

  if (!sede || !fecha_inicio || !fecha_fin || !cupo_maximo || cupo_maximo < 1) {
    return NextResponse.json({ error: 'sede, fecha_inicio, fecha_fin y cupo_maximo son requeridos' }, { status: 400 })
  }
  if (fecha_fin < fecha_inicio) {
    return NextResponse.json({ error: 'fecha_fin no puede ser anterior a fecha_inicio' }, { status: 400 })
  }

  const svc = serviceClient()
  const { data, error: insErr } = await svc
    .from('viajes_sede')
    .insert({ profesional_id: profesionalId, sede, fecha_inicio, fecha_fin, cupo_maximo, activo: true })
    .select('id, sede, fecha_inicio, fecha_fin, cupo_maximo, activo, created_at')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const { error, profesionalId } = await getProfesionalId()
  if (error) return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })

  const body = await request.json()
  const id: string = body.id
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const patch: Record<string, unknown> = {}
  if (body.sede !== undefined) patch.sede = body.sede
  if (body.fecha_inicio !== undefined) patch.fecha_inicio = body.fecha_inicio
  if (body.fecha_fin !== undefined) patch.fecha_fin = body.fecha_fin
  if (body.cupo_maximo !== undefined) patch.cupo_maximo = Number(body.cupo_maximo)
  if (body.activo !== undefined) patch.activo = Boolean(body.activo)

  const svc = serviceClient()
  const { data, error: updErr } = await svc
    .from('viajes_sede')
    .update(patch)
    .eq('id', id)
    .eq('profesional_id', profesionalId)
    .select('id, sede, fecha_inicio, fecha_fin, cupo_maximo, activo, created_at')
    .single()

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  return NextResponse.json(data)
}
