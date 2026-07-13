import { serviceClient } from '@/lib/supabase-service'

interface CreateCitaInput {
  titulo: string
  fecha: string
  hora_inicio: string
  hora_fin: string
  lead_id?: string | null
  profesional_id?: string | null
  notas?: string | null
  sede?: string
}

export async function createCita(input: CreateCitaInput) {
  const supabase = serviceClient()

  const { data, error } = await supabase
    .from('citas')
    .insert([{
      lead_id:         input.lead_id || null,
      titulo:          input.titulo,
      fecha:           input.fecha,
      hora_inicio:     input.hora_inicio,
      hora_fin:        input.hora_fin,
      notas:           input.notas || null,
      estado:          'pendiente',
      pago_confirmado: false,
      profesional_id:  input.profesional_id || null,
      sede:            input.sede || 'iquique',
    }])
    .select()
    .single()

  if (error) return { data: null, error }

  if (input.lead_id) {
    await supabase
      .from('leads')
      .update({ etapa: 'cita_agendada', updated_at: new Date().toISOString() })
      .eq('id', input.lead_id)
  }

  return { data, error: null }
}
