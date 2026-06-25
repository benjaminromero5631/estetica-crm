import { createLead } from '@/lib/leads'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { data, error } = await createLead(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
