import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sede = searchParams.get('sede') || 'iquique'

  if (sede === 'iquique') {
    return NextResponse.json({ viaje: null })
  }

  const supabase = serviceClient()
  const { data: viaje, error } = await supabase
    .from('viajes_sede')
    .select('fecha_inicio, fecha_fin, fecha_limite_evaluacion')
    .eq('sede', sede)
    .eq('activo', true)
    .order('fecha_inicio', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ viaje })
}
