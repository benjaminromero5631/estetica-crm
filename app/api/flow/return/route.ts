import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  await request.formData()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
  return NextResponse.redirect(`${baseUrl}/gracias`, { status: 303 })
}
