import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { ids } = await request.json()

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: 'ids requerido (array no vacio)' }, { status: 400 })
  }

  const supabase = serviceClient()
  const { error } = await supabase
    .from('leads')
    .update({ eliminado_at: new Date().toISOString() })
    .in('id', ids)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: ids.length })
}
