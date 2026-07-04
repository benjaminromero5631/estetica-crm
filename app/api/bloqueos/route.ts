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
    return NextResponse.json({ error, bloqueos: [] }, { status })
  }

  const svc = serviceClient()
  const { data, error: bErr } = await svc
    .from('bloqueos_horario')
    .select('id, fecha, motivo, created_at')
    .eq('profesional_id', profesionalId)
    .order('fecha', { ascending: true })

  if (bErr) return NextResponse.json({ error: bErr.message }, { status: 500 })

  return NextResponse.json({ error: null, bloqueos: data ?? [] })
}

export async function POST(request: Request) {
  const { error, profesionalId } = await getProfesionalId()
  if (error) return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })

  const body = await request.json()
  const fecha: string = body.fecha
  const motivo: string | null = body.motivo || null

  if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return NextResponse.json({ error: 'Fecha invalida (YYYY-MM-DD)' }, { status: 400 })
  }

  const svc = serviceClient()
  const { data, error: insErr } = await svc
    .from('bloqueos_horario')
    .insert({ profesional_id: profesionalId, fecha, motivo })
    .select('id, fecha, motivo, created_at')
    .single()

  if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })

  return NextResponse.json(data, { status: 201 })
}

export async function DELETE(request: Request) {
  const { error, profesionalId } = await getProfesionalId()
  if (error) return NextResponse.json({ error }, { status: error === 'NO_VINCULADO' ? 400 : 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id requerido' }, { status: 400 })

  const svc = serviceClient()
  const { error: delErr } = await svc
    .from('bloqueos_horario')
    .delete()
    .eq('id', id)
    .eq('profesional_id', profesionalId)

  if (delErr) return NextResponse.json({ error: delErr.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
