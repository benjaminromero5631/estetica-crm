import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
  const formData = await request.formData()
  const token = formData.get('token') as string | null

  if (!token) return new NextResponse('token requerido', { status: 400 })

  const apiKey = process.env.FLOW_API_KEY!
  const secret = process.env.FLOW_SECRET_KEY!

  const params: Record<string, string> = { apiKey, token }
  params.s = sign(params, secret)

  const qs = new URLSearchParams(params)
  const res = await fetch(`${process.env.FLOW_API_URL}/payment/getStatus?${qs.toString()}`)
  const status = await res.json()

  if (!res.ok) {
    console.error('Flow getStatus error:', status)
    return new NextResponse('Error consultando estado', { status: 502 })
  }

  // status 2 = pagado en Flow
  if (status.status === 2) {
    const supabase = serviceClient()
    const { data: citaData, error } = await supabase
      .from('citas')
      .update({
        pago_confirmado: true,
        pago_referencia: String(status.flowOrder),
        estado:          'confirmada',
      })
      .eq('id', status.commerceOrder)
      .select('lead_id')
      .single()

    if (error) {
      console.error('Supabase update error:', error)
      return new NextResponse('Error actualizando cita', { status: 500 })
    }

    if (citaData?.lead_id) {
      const { error: leadErr } = await supabase
        .from('leads')
        .update({ etapa: 'reserva_con_deposito' })
        .eq('id', citaData.lead_id)

      if (leadErr) console.error('Error actualizando etapa del lead:', leadErr)
    }
  }

  // Flow espera 200 vacio para confirmar recepcion del webhook
  return new NextResponse(null, { status: 200 })
}
