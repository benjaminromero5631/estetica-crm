'use client'

import { Lead, EtapaConfig } from '@/lib/types'

export default function StageProgress({ leads, etapas }: { leads: Lead[]; etapas: EtapaConfig[] }) {
  const total = leads.length || 1

  return (
    <div className="bg-white rounded-xl border p-4">
      <h2 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Leads por etapa</h2>
      <div className="space-y-2">
        {etapas.map(({ slug, nombre, color }) => {
          const count = leads.filter((l) => l.etapa === slug).length
          const pct = Math.round((count / total) * 100)
          return (
            <div key={slug}>
              <div className="flex justify-between text-xs mb-1" style={{ color: '#6B7280' }}>
                <span>{nombre}</span>
                <span>{count}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: color || '#1E40AF' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
