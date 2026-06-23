import { createClient as createAnonClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

export async function GET() {
  const supabase = createAnonClient()
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })

  console.log('Leads query result:', { data, error, count: data?.length })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = serviceClient()
  const body = await request.json()

  const { nombre, telefono, email, servicio_interes, fuente, notas, etapa, valor_estimado, ultima_vez_clinica } = body

  const { data, error } = await supabase
    .from('leads')
    .insert([{
      nombre,
      telefono,
      email: email || null,
      servicio_interes: servicio_interes || null,
      fuente: fuente || null,
      notas: notas || null,
      etapa: etapa ?? 'nuevo',
      valor_estimado: valor_estimado || null,
      ultima_vez_clinica: ultima_vez_clinica || null,
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
