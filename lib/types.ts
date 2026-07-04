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
  lead_num?: number | null
  created_at: string
  updated_at: string
}

export interface Cita {
  id: string
  lead_id: string | null
  profesional_id?: string | null
  titulo: string | null
  fecha: string           // 'YYYY-MM-DD'
  hora_inicio: string     // 'HH:MM'
  hora_fin: string        // 'HH:MM'
  pago_confirmado: boolean
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

export interface HorarioDisponible {
  id: string
  profesional_id: string
  dia_semana: number      // 0=domingo, 1=lunes, ..., 6=sabado
  hora_inicio: string     // 'HH:MM'
  hora_fin: string        // 'HH:MM'
  duracion_bloque: number
  activo: boolean
}

export interface BloqueoHorario {
  id: string
  profesional_id: string
  fecha: string            // 'YYYY-MM-DD'
  motivo: string | null
  created_at: string
}

export interface EtapaConfig {
  id: string
  nombre: string
  slug: string
  color: string
  orden: number
}
