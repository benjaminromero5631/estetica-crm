import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = serviceClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('citas')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = serviceClient()

  // Get cita to know if we need to reset lead
  const { data: cita } = await supabase
    .from('citas')
    .select('lead_id')
    .eq('id', params.id)
    .single()

  const { error } = await supabase.from('citas').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (cita?.lead_id) {
    await supabase
      .from('leads')
      .update({ fecha_cita: null, updated_at: new Date().toISOString() })
      .eq('id', cita.lead_id)
  }

  return new NextResponse(null, { status: 204 })
}
