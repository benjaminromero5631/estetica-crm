import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { clinicConfig } from '@/lib/config'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

function sign(params: Record<string, string>, secret: string): string {
  const msg = Object.keys(params).sort().map(k => k + params[k]).join('')
  return crypto.createHmac('sha256', secret).update(msg).digest('hex')
}

export async function POST(request: Request) {
  const { citaId } = await request.json()
  if (!citaId) return NextResponse.json({ error: 'citaId requerido' }, { status: 400 })

  const supabase = serviceClient()
  const { data: cita, error: citaErr } = await supabase
    .from('citas')
    .select('id, lead_id, leads(email, nombre)')
    .eq('id', citaId)
    .single()

  if (citaErr || !cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lead = (cita as any).leads
  const email: string = lead?.email ?? 'sin-email@reserva.cl'

  const apiKey = process.env.FLOW_API_KEY!
  const secret = process.env.FLOW_SECRET_KEY!
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const params: Record<string, string> = {
    apiKey,
    amount:          String(clinicConfig.depositoReserva),
    commerceOrder:   citaId,
    currency:        'CLP',
    email,
    subject:         `Reserva ${clinicConfig.mainService}`,
    urlConfirmation: `${baseUrl}/api/flow/confirm`,
    urlReturn:       `${baseUrl}/api/flow/return`,
  }

  console.log('FLOW_DEBUG monto:', clinicConfig.depositoReserva, 'servicio:', clinicConfig.mainService, 'params:', JSON.stringify({ ...params, apiKey: '[REDACTED]' }))
  params.s = sign(params, secret)

  const body = new URLSearchParams(params)
  const res = await fetch(`${process.env.FLOW_API_URL}/payment/create`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })

  const data = await res.json()

  if (!res.ok || !data.url || !data.token) {
    console.error('Flow error:', data)
    return NextResponse.json({ error: 'Error al crear orden en Flow', detail: data }, { status: 502 })
  }

  return NextResponse.json({ redirectUrl: `${data.url}?token=${data.token}` })
}
