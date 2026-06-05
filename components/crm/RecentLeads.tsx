'use client'

import { Lead, EtapaConfig } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import { Users } from 'lucide-react'

export default function RecentLeads({ leads, etapas }: { leads: Lead[]; etapas: EtapaConfig[] }) {
  const recent = leads.slice(0, 8)

  return (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2E8F0' }}>
      <h2 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Leads recientes</h2>

      {recent.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-3">
          <div className="rounded-full p-4" style={{ background: '#EFF6FF' }}>
            <Users className="w-8 h-8" style={{ color: '#BFDBFE' }} />
          </div>
          <p className="text-sm font-medium" style={{ color: '#374151' }}>Aún no hay actividad</p>
          <p className="text-xs text-center max-w-xs" style={{ color: '#9CA3AF' }}>
            Los nuevos leads aparecerán aquí cuando los agregues desde el Pipeline o la sección Leads.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {recent.map((lead) => {
            const etapa = etapas.find((e) => e.slug === lead.etapa)
            return (
              <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0" style={{ borderColor: '#F1F5F9' }}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate" style={{ color: '#1F2937' }}>{lead.nombre}</p>
                  <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{lead.servicio_interes ?? '—'}</p>
                </div>
                <div className="flex items-center gap-3 ml-3 flex-shrink-0">
                  {etapa && (
                    <span
                      className="text-xs px-2 py-0.5 rounded-full font-medium"
                      style={{ background: etapa.color + '22', color: etapa.color }}
                    >
                      {etapa.nombre}
                    </span>
                  )}
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    {formatDistanceToNow(new Date(lead.created_at), { locale: es, addSuffix: true })}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
