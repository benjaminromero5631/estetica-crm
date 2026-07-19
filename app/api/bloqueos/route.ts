import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'
import { getProfesionalScope, resolveProfesionalIdForWrite } from '@/lib/auth-scope'

export async function GET(request: Request) {
  const { error, profesionalId, isAdmin } = await getProfesionalScope()
  if (error) {
    const status = error === 'NO_VINCULADO' ? 200 : 401
    return NextResponse.json({ error, bloqueos: [] }, { status })
  }

  const { searchParams } = new URL(request.url)
  const sede = searchParams.get('sede') || 'iquique'

  const svc = serviceClient()
  let query = svc
    .from('bloqueos_horario')
    .select('id, fecha, motivo, sede, created_at')
    .eq('sede', sede)
    .order('fecha', { ascending: true })

  if (!isAdmin) {
    query = query.eq('profesional_id', profesionalId)
  }

  const { data, error: bErr } = await query

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

  return NextResponse.json({ error: null, bloqueos: data ?? [] })
}

export async function POST(request: Request) {
  const { error, profesionalId, isAdmin } = await getProfesionalScope()
  if (error) return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })

  const writeProfesionalId = await resolveProfesionalIdForWrite(isAdmin, profesionalId)
  if (!writeProfesionalId) {
    return NextResponse.json({ error: 'No hay profesional activo para asignar' }, { status: 400 })
  }

  const body = await request.json()
  const fecha: string = body.fecha
  const motivo: string | null = body.motivo || null
  const sede: string = body.sede || 'iquique'

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: 'Fecha invalida (YYYY-MM-DD)' }, { status: 400 })
  }

  const svc = serviceClient()
  const { data, error: insErr } = await svc
    .from('bloqueos_horario')
    .insert({ profesional_id: writeProfesionalId, fecha, motivo, sede })
    .select('id, fecha, motivo, sede, created_at')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const { error, profesionalId, isAdmin } = await getProfesionalScope()
  if (error) return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })

  const writeProfesionalId = await resolveProfesionalIdForWrite(isAdmin, profesionalId)
  if (!writeProfesionalId) {
    return NextResponse.json({ error: 'No hay profesional activo para asignar' }, { status: 400 })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const svc = serviceClient()
  const { error: delErr } = await svc
    .from('bloqueos_horario')
    .delete()
    .eq('id', id)
    .eq('profesional_id', writeProfesionalId)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
