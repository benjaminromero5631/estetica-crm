export interface Lead {
  id: string
  nombre: string
  telefono: string
  email?: string
  servicio_interes?: string
  fuente?: string
  etapa: string
  notas?: string
  valor_estimado?: number
  convertido_at?: string | null
  deposito_pagado?: boolean
  fecha_cita?: string | null
  ultima_vez_clinica?: string | null
  created_at: string
  updated_at: string
}

export interface Cita {
  id: string
  lead_id: string | null
  titulo: string | null
  fecha_inicio: string | null
  fecha_fin: string | null
  // campos de citas desde /agendar
  fecha?: string | null
  hora_inicio?: string | null
  hora_fin?: string | null
  pago_confirmado?: boolean | null
  profesional_id?: string | null
  notas?: string | null
  estado: 'pendiente' | 'completada' | 'cancelada'
  created_at: string
  updated_at: string
  // joined from leads
  nombre?: string | null
  telefono?: string | null
  servicio_interes?: string | null
  // joined from profesionales
  nombre_profesional?: string | null
}

export interface EtapaConfig {
  id: string
  nombre: string
  slug: string
  color: string
  orden: number
}
