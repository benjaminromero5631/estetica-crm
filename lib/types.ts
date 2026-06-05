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

export interface EtapaConfig {
  id: string
  nombre: string
  slug: string
  color: string
  orden: number
}
