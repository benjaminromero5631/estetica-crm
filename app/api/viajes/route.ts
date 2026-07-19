import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'
import { getProfesionalScope, resolveProfesionalIdForWrite } from '@/lib/auth-scope'

export async function GET() {
  const { error, profesionalId, isAdmin } = await getProfesionalScope()
  if (error) {
    const status = error === 'NO_VINCULADO' ? 200 : 401
    return NextResponse.json({ error, viajes: [] }, { status })
  }

  const svc = serviceClient()
  let query = svc
    .from('viajes_sede')
    .select('id, sede, fecha_inicio, fecha_fin, cupo_maximo, activo, created_at')
    .order('fecha_inicio', { ascending: false })

  if (!isAdmin) {
    query = query.eq('profesional_id', profesionalId)
  }

  const { data, error: vErr } = await query

  if (vErr) return NextResponse.json({ error: vErr.message }, { status: 500 })

  return NextResponse.json({ error: null, viajes: data ?? [] })
}

export async function POST(request: Request) {
  const { error, profesionalId, isAdmin } = await getProfesionalScope()
  if (error) return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })

  const writeProfesionalId = await resolveProfesionalIdForWrite(isAdmin, profesionalId)
  if (!writeProfesionalId) {
    return NextResponse.json({ error: 'No hay profesional activo para asignar' }, { status: 400 })
  }

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
    .insert({ profesional_id: writeProfesionalId, sede, fecha_inicio, fecha_fin, cupo_maximo, activo: true })
    .select('id, sede, fecha_inicio, fecha_fin, cupo_maximo, activo, created_at')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const { error, profesionalId, isAdmin } = await getProfesionalScope()
  if (error) return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })

  const writeProfesionalId = await resolveProfesionalIdForWrite(isAdmin, profesionalId)
  if (!writeProfesionalId) {
    return NextResponse.json({ error: 'No hay profesional activo para asignar' }, { status: 400 })
  }

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
    .eq('profesional_id', writeProfesionalId)
    .select('id, sede, fecha_inicio, fecha_fin, cupo_maximo, activo, created_at')
    .single()

  if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })

  return NextResponse.json(data)
}
