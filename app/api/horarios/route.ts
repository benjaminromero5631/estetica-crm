import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'
import { getProfesionalScope, resolveProfesionalIdForWrite } from '@/lib/auth-scope'

export async function GET(request: Request) {
  const { error, profesionalId, isAdmin } = await getProfesionalScope()
  if (error) {
    const status = error === 'NO_VINCULADO' ? 200 : 401
    return NextResponse.json({ error, profesional_id: null, horarios: [] }, { status })
  }

  const { searchParams } = new URL(request.url)
  const sede = searchParams.get('sede') || 'iquique'

  const svc = serviceClient()
  let query = svc
    .from('horarios_disponibles')
    .select('id, dia_semana, hora_inicio, hora_fin, duracion_bloque, activo, sede')
    .eq('sede', sede)
    .order('dia_semana', { ascending: true })

  if (!isAdmin) {
    query = query.eq('profesional_id', profesionalId)
  }

  const { data, error: hErr } = await query

  if (hErr) return NextResponse.json({ error: hErr.message }, { status: 500 })

  return NextResponse.json({ error: null, profesional_id: profesionalId, horarios: data ?? [] })
}

interface BloqueInput {
  hora_inicio: string
  hora_fin: string
  duracion_bloque: number
}

interface DiaInput {
  dia_semana: number
  bloques: BloqueInput[]
}

export async function PUT(request: Request) {
  const { error, profesionalId, isAdmin } = await getProfesionalScope()
  if (error) {
    return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })
  }

  const writeProfesionalId = await resolveProfesionalIdForWrite(isAdmin, profesionalId)
  if (!writeProfesionalId) {
    return NextResponse.json({ error: 'No hay profesional activo para asignar' }, { status: 400 })
  }

  const body = await request.json()
  const dias: DiaInput[] = body.dias
  const sede: string = body.sede || 'iquique'

  if (!Array.isArray(dias) || dias.length !== 7) {
    return NextResponse.json({ error: 'Se requieren los 7 dias de la semana' }, { status: 400 })
  }

  for (const d of dias) {
    if (!Array.isArray(d.bloques)) {
      return NextResponse.json({ error: 'Cada dia requiere un arreglo de bloques' }, { status: 400 })
    }
    for (const b of d.bloques) {
      if (!b.hora_inicio || !b.hora_fin || b.hora_fin <= b.hora_inicio) {
        return NextResponse.json({ error: 'Cada bloque requiere hora_inicio menor a hora_fin' }, { status: 400 })
      }
    }
  }

  const svc = serviceClient()

  const { error: delErr } = await svc
    .from('horarios_disponibles')
    .delete()
    .eq('profesional_id', writeProfesionalId)
    .eq('sede', sede)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  const rows = dias.flatMap(d => d.bloques.map(b => ({
    profesional_id: writeProfesionalId,
    dia_semana: d.dia_semana,
    hora_inicio: b.hora_inicio,
    hora_fin: b.hora_fin,
    duracion_bloque: b.duracion_bloque || 60,
    activo: true,
    sede,
  })))

  if (rows.length > 0) {
    const { error: insErr } = await svc.from('horarios_disponibles').insert(rows)
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
