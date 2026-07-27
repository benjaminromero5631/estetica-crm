import { createLead } from '@/lib/leads'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const body = await request.json()
  const { nombre, telefono, notas } = body

  if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
    return NextResponse.json({ error: 'nombre es requerido' }, { status: 400 })
  }
  if (!telefono || typeof telefono !== 'string' || telefono.trim() === '') {
    return NextResponse.json({ error: 'telefono es requerido' }, { status: 400 })
  }

  const { data, error } = await createLead({
    nombre,
    telefono,
    notas: notas || null,
    fuente: 'chatbot_directo',
    servicio_interes: 'otomodelacion',
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ id: data.id })
}
