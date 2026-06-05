'use client'

import { Lead, EtapaConfig } from '@/lib/types'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

export default function RecentLeads({ leads, etapas }: { leads: Lead[]; etapas: EtapaConfig[] }) {
  const recent = leads.slice(0, 8)

  return (
    <div className="bg-white rounded-xl border p-4">
      <h2 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Leads recientes</h2>
      <div className="space-y-2">
        {recent.length === 0 && (
          <p className="text-sm" style={{ color: '#9CA3AF' }}>No hay leads aun.</p>
        )}
        {recent.map((lead) => {
          const etapa = etapas.find((e) => e.slug === lead.etapa)
          return (
            <div key={lead.id} className="flex items-center justify-between py-2 border-b last:border-0">
              <div>
                <p className="text-sm font-medium" style={{ color: '#1F2937' }}>{lead.nombre}</p>
                <p className="text-xs" style={{ color: '#9CA3AF' }}>{lead.servicio_interes ?? '-'}</p>
              </div>
              <div className="flex items-center gap-3">
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
    </div>
  )
}
