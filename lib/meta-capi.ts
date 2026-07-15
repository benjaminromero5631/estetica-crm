import { createHash } from 'crypto'

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

interface PurchaseEventInput {
  value: number
  currency?: string
  telefono?: string | null
  email?: string | null
  servicioInteres?: string | null
}

export async function sendPurchaseEvent({ value, currency = 'CLP', telefono, email, servicioInteres }: PurchaseEventInput) {
  const pixelId = process.env.META_PIXEL_ID
  const accessToken = process.env.META_ACCESS_TOKEN

  if (!pixelId || !accessToken) return { ok: false, skipped: true }

  const userData: Record<string, string[]> = {}
  if (telefono) userData.ph = [sha256(telefono.replace(/\D/g, ''))]
  if (email) userData.em = [sha256(email)]

  // servicio_interes es texto libre (no enum), asi que esto es un match parcial:
  // sin dato -> sin_servicio_definido, contiene "otomodel" -> otomodelacion,
  // cualquier otro valor real -> metodo_regenerativo.
  const contentName = !servicioInteres
    ? 'sin_servicio_definido'
    : servicioInteres.toLowerCase().includes('otomodel')
      ? 'otomodelacion'
      : 'metodo_regenerativo'

  const res = await fetch(`https://graph.facebook.com/v20.0/${pixelId}/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      data: [
        {
          event_name: 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          action_source: 'system_generated',
          user_data: userData,
          custom_data: { value, currency, content_name: contentName },
        },
      ],
      access_token: accessToken,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('Meta CAPI error:', body)
    return { ok: false }
  }

  return { ok: true }
}
