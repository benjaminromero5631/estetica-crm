'use client'

import { Lead, EtapaConfig } from '@/lib/types'
import { Users, TrendingUp, CheckCircle, XCircle } from 'lucide-react'

export default function MetricCards({ leads, etapas }: { leads: Lead[]; etapas: EtapaConfig[] }) {
  const total = leads.length
  const convertidoSlug = etapas.find((e) => e.slug === 'convertido')?.slug ?? 'convertido'
  const perdidoSlug = etapas.find((e) => e.slug === 'perdido')?.slug ?? 'perdido'
  const convertidos = leads.filter((l) => l.etapa === convertidoSlug).length
  const perdidos = leads.filter((l) => l.etapa === perdidoSlug).length
  const conversion = total > 0 ? Math.round((convertidos / total) * 100) : 0

  const cards = [
    { label: 'Total Leads', value: total, icon: Users, color: '#1E40AF' },
    { label: 'Convertidos', value: convertidos, icon: CheckCircle, color: '#16A34A' },
    { label: 'Perdidos', value: perdidos, icon: XCircle, color: '#DC2626' },
    { label: 'Conversión', value: `${conversion}%`, icon: TrendingUp, color: '#38BCD4' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: '#E2E8F0' }}>
          <Icon className="w-8 h-8" style={{ color }} />
          <div>
            <p className="text-sm" style={{ color: '#6B7280' }}>{label}</p>
            <p className="text-2xl font-bold" style={{ color: '#1F2937' }}>{value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
