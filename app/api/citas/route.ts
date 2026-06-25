import { serviceClient } from '@/lib/supabase-service'
import { createCita } from '@/lib/citas'
import { NextResponse } from 'next/server'

function svcClient() {
  return serviceClient()
}

export async function GET() {
  const supabase = svcClient()
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
  const body = await request.json()
  const { data, error } = await createCita(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
