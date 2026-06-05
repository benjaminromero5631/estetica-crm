'use client'

import { Lead, EtapaConfig } from '@/lib/types'
import { clinicConfig } from '@/lib/config'
import { Users, TrendingUp, CheckCircle, XCircle, ArrowUp, ArrowDown, Minus } from 'lucide-react'

function getTrend(current: number, previous: number): { pct: number | null; direction: 'up' | 'down' | 'neutral' } {
  if (previous === 0 && current === 0) return { pct: null, direction: 'neutral' }
  if (previous === 0) return { pct: null, direction: 'up' }
  const pct = Math.round(((current - previous) / previous) * 100)
  return { pct: Math.abs(pct), direction: pct > 0 ? 'up' : pct < 0 ? 'down' : 'neutral' }
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const { pct, direction } = getTrend(current, previous)
  if (direction === 'neutral' || pct === null) {
    return <span className="flex items-center gap-0.5 text-xs" style={{ color: '#94A3B8' }}><Minus className="w-3 h-3" />—</span>
  }
  const color = direction === 'up' ? '#16A34A' : '#DC2626'
  const Icon = direction === 'up' ? ArrowUp : ArrowDown
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color }}>
      <Icon className="w-3 h-3" />{pct}%
    </span>
  )
}

function leadsThisMonth(leads: Lead[], offset = 0): number {
  const now = new Date()
  const year = offset === 0 ? now.getFullYear() : (now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear())
  const month = offset === 0 ? now.getMonth() : (now.getMonth() === 0 ? 11 : now.getMonth() - 1)
  return leads.filter((l) => {
    const d = new Date(l.created_at)
    return d.getFullYear() === year && d.getMonth() === month
  }).length
}

export default function MetricCards({ leads, etapas }: { leads: Lead[]; etapas: EtapaConfig[] }) {
  const total = leads.length
  const convertidoSlug = etapas.find((e) => e.slug === 'convertido')?.slug ?? 'convertido'
  const perdidoSlug   = etapas.find((e) => e.slug === 'perdido')?.slug   ?? 'perdido'
  const convertidos = leads.filter((l) => l.etapa === convertidoSlug).length
  const perdidos    = leads.filter((l) => l.etapa === perdidoSlug).length
  const conversion  = total > 0 ? Math.round((convertidos / total) * 100) : 0

  const thisMonth = leadsThisMonth(leads, 0)
  const lastMonth = leadsThisMonth(leads, 1)

  const thisMonthConv = leads.filter((l) => l.etapa === convertidoSlug && (() => {
    const now = new Date(); const d = new Date(l.created_at)
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  })()).length
  const lastMonthConv = leads.filter((l) => l.etapa === convertidoSlug && (() => {
    const now = new Date(); const d = new Date(l.created_at)
    const lm = now.getMonth() === 0 ? 11 : now.getMonth() - 1
    const ly = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
    return d.getFullYear() === ly && d.getMonth() === lm
  })()).length

  const cards = [
    { label: 'Total Leads',  value: total,         icon: Users,       color: clinicConfig.primaryColor, curr: thisMonth,     prev: lastMonth },
    { label: 'Convertidos',  value: convertidos,   icon: CheckCircle, color: '#16A34A',                 curr: thisMonthConv, prev: lastMonthConv },
    { label: 'Perdidos',     value: perdidos,      icon: XCircle,     color: '#DC2626',                 curr: 0,             prev: 0 },
    { label: 'Conversión',   value: `${conversion}%`, icon: TrendingUp, color: clinicConfig.accentColor, curr: conversion,  prev: 0 },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color, curr, prev }) => (
        <div key={label} className="bg-white rounded-xl border p-4 flex items-center gap-4" style={{ borderColor: '#E2E8F0' }}>
          <div className="rounded-xl p-2.5" style={{ background: color + '15' }}>
            <Icon className="w-6 h-6" style={{ color }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs" style={{ color: '#6B7280' }}>{label}</p>
            <p className="text-2xl font-bold leading-tight" style={{ color: '#1F2937' }}>{value}</p>
            <div className="mt-0.5">
              <TrendBadge current={curr} previous={prev} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
