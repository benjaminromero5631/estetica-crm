import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('citas')
    .select(`
      id,
      fecha,
      hora_inicio,
      hora_fin,
      estado,
      pago_confirmado,
      titulo,
      notas,
      lead_id,
      profesional_id,
      created_at,
      updated_at,
      leads (nombre, telefono, servicio_interes),
      profesionales (nombre)
    `)
    .order('fecha', { ascending: true })
    .order('hora_inicio', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const flat = (data ?? []).map((row: any) => {
    const { leads, profesionales, ...c } = row
    return {
      ...c,
      nombre:             leads?.nombre             ?? null,
      telefono:           leads?.telefono            ?? null,
      servicio_interes:   leads?.servicio_interes    ?? null,
      nombre_profesional: profesionales?.nombre      ?? null,
    }
  })

  return NextResponse.json(flat)
}

export async function POST(request: Request) {
  const supabase = serviceClient()
  const body = await request.json()
  const { lead_id, titulo, fecha, hora_inicio, hora_fin, notas, profesional_id } = body

  const { data, error } = await supabase
    .from('citas')
    .insert([{
      lead_id: lead_id || null,
      titulo,
      fecha,
      hora_inicio,
      hora_fin,
      notas: notas || null,
      estado: 'pendiente',
      pago_confirmado: false,
      profesional_id: profesional_id || null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (lead_id) {
    await supabase
      .from('leads')
      .update({ etapa: 'cita_agendada', updated_at: new Date().toISOString() })
      .eq('id', lead_id)
  }

  return NextResponse.json(data, { status: 201 })
}
