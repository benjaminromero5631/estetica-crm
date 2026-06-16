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
      *,
      leads (nombre, telefono, servicio_interes),
      profesionales (nombre)
    `)
    .order('fecha_inicio', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  type RawCita = {
    leads: { nombre: string; telefono: string; servicio_interes: string } | null
    profesionales: { nombre: string } | null
    fecha: string | null
    hora_inicio: string | null
    hora_fin: string | null
    fecha_inicio: string | null
    fecha_fin: string | null
    [key: string]: unknown
  }

  const flat = (data ?? []).map(({ leads, profesionales, fecha, hora_inicio, hora_fin, fecha_inicio, fecha_fin, ...c }: RawCita) => {
    // Citas desde /agendar usan fecha+hora_inicio/hora_fin; citas del CRM usan fecha_inicio/fecha_fin
    const fi = fecha_inicio ?? (fecha && hora_inicio ? `${fecha}T${hora_inicio}` : null)
    const ff = fecha_fin   ?? (fecha && hora_fin    ? `${fecha}T${hora_fin}`    : null)
    return {
      ...c,
      fecha,
      hora_inicio,
      hora_fin,
      fecha_inicio: fi,
      fecha_fin:    ff,
      nombre:           leads?.nombre         ?? null,
      telefono:         leads?.telefono        ?? null,
      servicio_interes: leads?.servicio_interes ?? null,
      nombre_profesional: profesionales?.nombre ?? null,
    }
  })

  return NextResponse.json(flat)
}

export async function POST(request: Request) {
  const supabase = serviceClient()
  const body = await request.json()
  const { lead_id, titulo, fecha_inicio, fecha_fin, notas } = body

  const { data, error } = await supabase
    .from('citas')
    .insert([{ lead_id: lead_id || null, titulo, fecha_inicio, fecha_fin, notas: notas || null }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (lead_id) {
    await supabase
      .from('leads')
      .update({ fecha_cita: fecha_inicio, etapa: 'cita_agendada', updated_at: new Date().toISOString() })
      .eq('id', lead_id)
  }

  return NextResponse.json(data, { status: 201 })
}
