import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.N8N_WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const lead_id = searchParams.get('lead_id')

  if (!lead_id) {
    return NextResponse.json({ error: 'Parámetro lead_id requerido' }, { status: 400 })
  }

  const { data, error } = await serviceClient()
    .from('citas')
    .select('id, fecha, hora_inicio, estado')
    .eq('lead_id', lead_id)
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({
    tiene_cita: data !== null,
    cita: data ?? null,
  })
}
