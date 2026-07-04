import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getPaymentStatus } from '@/lib/flow'
import { sendPurchaseEvent } from '@/lib/meta-capi'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function POST(request: Request) {
  const formData = await request.formData()
  const token = formData.get('token') as string | null

  if (!token) return new NextResponse('token requerido', { status: 400 })

  const { ok, data: status } = await getPaymentStatus(token)

  if (!ok) {
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
      const { data: lead, error: leadErr } = await supabase
        .from('leads')
        .update({ etapa: 'reserva_con_deposito' })
        .eq('id', citaData.lead_id)
        .select('telefono, email, valor_estimado')
        .single()

      if (leadErr) console.error('Error actualizando etapa del lead:', leadErr)

      if (lead?.valor_estimado != null) {
        sendPurchaseEvent({
          value: lead.valor_estimado,
          telefono: lead.telefono,
          email: lead.email,
        }).catch((err) => console.error('Error enviando evento a Meta CAPI:', err))
      }
    }
  }

  // Flow espera 200 vacio para confirmar recepcion del webhook
  return new NextResponse(null, { status: 200 })
}
