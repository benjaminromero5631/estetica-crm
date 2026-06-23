import { NextResponse } from 'next/server'
import { getPaymentStatus } from '@/lib/flow'

export async function POST(request: Request) {
  const formData = await request.formData()
  const token = formData.get('token') as string | null
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/gracias?status=unconfirmed`, { status: 303 })
  }

  const { ok, data: status } = await getPaymentStatus(token)

  console.log('Flow status:', status.status, 'order:', status.commerceOrder)

  if (!ok) {
    return NextResponse.redirect(`${baseUrl}/gracias?status=unconfirmed`, { status: 303 })
  }

  if (status.status === 2) {
    return NextResponse.redirect(`${baseUrl}/gracias?status=success`, { status: 303 })
  }

  return NextResponse.redirect(
    `${baseUrl}/gracias?status=unconfirmed&citaId=${status.commerceOrder}`,
    { status: 303 }
  )
}
