import { createCita } from '@/lib/citas'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { data, error } = await createCita(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
