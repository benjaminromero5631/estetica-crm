import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('etapas_config')
    .select('*')
    .order('orden', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
