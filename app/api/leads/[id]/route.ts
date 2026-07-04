import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = serviceClient()
  const body = await request.json()

  const { data, error } = await supabase
    .from('leads')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const supabase = serviceClient()
  const { error } = await supabase
    .from('leads')
    .update({ eliminado_at: new Date().toISOString() })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return new NextResponse(null, { status: 204 })
}
