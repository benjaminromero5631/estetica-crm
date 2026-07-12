import { serviceClient } from '@/lib/supabase-service'

interface CreateLeadInput {
  nombre: string
  telefono: string
  email?: string | null
  servicio_interes?: string | null
  fuente?: string | null
  notas?: string | null
  etapa?: string
  valor_estimado?: number | null
  ultima_vez_clinica?: string | null
}

export async function getLeadByTelefono(telefono: string) {
  const supabase = serviceClient()
  return supabase
    .from('leads')
    .select('*')
    .eq('telefono', telefono)
}

export async function updateLead(id: string, input: Partial<CreateLeadInput>) {
  const supabase = serviceClient()
  return supabase
    .from('leads')
    .update(input)
    .eq('id', id)
    .select()
    .single()
}

export async function createLead(input: CreateLeadInput) {
  const supabase = serviceClient()
  return supabase
    .from('leads')
    .insert([{
      nombre:              input.nombre,
      telefono:            input.telefono,
      email:               input.email || null,
      servicio_interes:    input.servicio_interes || null,
      fuente:              input.fuente || null,
      notas:               input.notas || null,
      etapa:               input.etapa ?? 'nuevo',
      valor_estimado:      input.valor_estimado || null,
      ultima_vez_clinica:  input.ultima_vez_clinica || null,
    }])
    .select()
    .single()
}
