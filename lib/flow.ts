import crypto from 'crypto'

export function signFlow(params: Record<string, string>, secret: string): string {
  const msg = Object.keys(params).sort().map(k => k + params[k]).join('')
  return crypto.createHmac('sha256', secret).update(msg).digest('hex')
}

export async function getPaymentStatus(token: string): Promise<{ ok: boolean; data: Record<string, unknown> }> {
  const apiKey = process.env.FLOW_API_KEY!
  const secret = process.env.FLOW_SECRET_KEY!
  const params: Record<string, string> = { apiKey, token }
  params.s = signFlow(params, secret)
  const res = await fetch(`${process.env.FLOW_API_URL}/payment/getStatus?${new URLSearchParams(params)}`)
  const data = await res.json()
  return { ok: res.ok, data }
}
