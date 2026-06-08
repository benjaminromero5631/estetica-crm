'use client'

import Link from 'next/link'
import { formatCLP, formatTrend } from '@/lib/format'
import { clinicConfig } from '@/lib/config'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'
import {
  DollarSign, TrendingUp, Users, Percent, Target, AlertTriangle,
  ArrowUp, ArrowDown, Minus,
} from 'lucide-react'

interface Metricas {
  total_leads: number
  leads_este_mes: number
  leads_esta_semana: number
  leads_hoy: number
  leads_mes_anterior: number
  total_convertidos: number
  convertidos_este_mes: number
  convertidos_esta_semana: number
  convertidos_mes_anterior: number
  tasa_conversion: number
  facturado_total: number
  facturado_este_mes: number
  facturado_esta_semana: number
  facturado_mes_anterior: number
  valor_en_pipeline: number
  valor_perdido: number
  ticket_promedio: number
  leads_perdidos: number
  tasa_perdidos: number
  leads_en_pipeline: number
  leads_por_etapa: Array<{ etapa: string; nombre: string; color: string; count: number; valor: number }>
  top_servicios: Array<{ servicio: string; count: number; valor: number }> | null
  top_fuentes: Array<{ fuente: string; count: number }> | null
  tendencia_mensual: Array<{ mes: string; leads: number; convertidos: number; facturado: number }> | null
}

interface RecentLead {
  id: string
  nombre: string
  servicio_interes?: string
  etapa: string
  created_at: string
}

function TrendBadge({ current, previous }: { current: number; previous: number }) {
  const trend = formatTrend(current, previous)
  if (!trend) return <span className="flex items-center gap-0.5 text-xs" style={{ color: '#94A3B8' }}><Minus className="w-3 h-3" />—</span>
  const color = trend.up ? '#16A34A' : '#DC2626'
  const Icon = trend.up ? ArrowUp : ArrowDown
  return (
    <span className="flex items-center gap-0.5 text-xs font-medium" style={{ color }}>
      <Icon className="w-3 h-3" />{Math.abs(Number(trend.value))}%
    </span>
  )
}

function KPICard({
  label, value, icon: Icon, iconColor, sub, trendCurrent, trendPrevious,
}: {
  label: string
  value: string
  icon: React.ElementType
  iconColor: string
  sub?: string
  trendCurrent?: number
  trendPrevious?: number
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-5 flex gap-4 items-start" style={{ borderColor: '#E2E8F0' }}>
      <div className="rounded-xl p-2.5 flex-shrink-0" style={{ background: iconColor + '18' }}>
        <Icon className="w-5 h-5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{label}</p>
        <p className="text-2xl font-bold leading-tight mt-0.5" style={{ color: '#111827' }}>{value}</p>
        <div className="flex items-center gap-2 mt-1">
          {trendCurrent !== undefined && trendPrevious !== undefined ? (
            <TrendBadge current={trendCurrent} previous={trendPrevious} />
          ) : null}
          {sub && <span className="text-xs" style={{ color: '#9CA3AF' }}>{sub}</span>}
        </div>
      </div>
    </div>
  )
}

export default function CEODashboard({
  metricas: m,
  recentLeads,
}: {
  metricas: Metricas | null
  recentLeads: RecentLead[]
}) {
  if (!m) {
    return (
      <div className="p-6">
        <p className="text-sm" style={{ color: '#9CA3AF' }}>Sin datos disponibles. Asegurate de ejecutar la funcion get_metricas() en Supabase.</p>
      </div>
    )
  }

  const convColor =
    m.tasa_conversion >= 20 ? '#16A34A' : m.tasa_conversion < 10 ? '#DC2626' : '#F59E0B'

  // Bar chart dimensions
  const tendencia = m.tendencia_mensual ?? []
  const maxFact = Math.max(...tendencia.map((t) => t.facturado), 1)
  const maxLeads = Math.max(...tendencia.map((t) => t.leads), 1)

  const etapaColors: Record<string, string> = {}
  ;(m.leads_por_etapa ?? []).forEach((e) => { etapaColors[e.etapa] = e.color })

  return (
    <div className="p-4 md:p-6 space-y-6">

      {/* KPI Row 1 — Revenue */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        <KPICard
          label="Facturado Este Mes"
          value={formatCLP(m.facturado_este_mes)}
          icon={DollarSign}
          iconColor="#10B981"
          sub="vs mes anterior"
          trendCurrent={m.facturado_este_mes}
          trendPrevious={m.facturado_mes_anterior}
        />
        <KPICard
          label="Facturado Esta Semana"
          value={formatCLP(m.facturado_esta_semana)}
          icon={TrendingUp}
          iconColor="#8B5CF6"
          sub={`Total: ${formatCLP(m.facturado_total)}`}
        />
        <KPICard
          label="En Pipeline"
          value={formatCLP(m.valor_en_pipeline)}
          icon={Target}
          iconColor="#3B82F6"
          sub={`${m.leads_en_pipeline} leads activos`}
        />
      </div>

      {/* KPI Row 2 — Operaciones */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
        <KPICard
          label="Total Leads"
          value={String(m.total_leads)}
          icon={Users}
          iconColor="#1E40AF"
          sub={`${m.leads_este_mes} este mes`}
          trendCurrent={m.leads_este_mes}
          trendPrevious={m.leads_mes_anterior}
        />
        <div className="bg-white rounded-xl shadow-sm border p-5 flex gap-4 items-start" style={{ borderColor: '#E2E8F0' }}>
          <div className="rounded-xl p-2.5 flex-shrink-0" style={{ background: convColor + '18' }}>
            <Percent className="w-5 h-5" style={{ color: convColor }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium" style={{ color: '#6B7280' }}>Tasa Conversion</p>
            <p className="text-2xl font-bold leading-tight mt-0.5" style={{ color: convColor }}>{m.tasa_conversion}%</p>
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>{m.total_convertidos} convertidos</p>
          </div>
        </div>
        <KPICard
          label="Ticket Promedio"
          value={formatCLP(m.ticket_promedio)}
          icon={DollarSign}
          iconColor="#F59E0B"
          sub="en convertidos"
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: '#E2E8F0' }}>
        <h2 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>Evolucion de Ingresos — Ultimos 6 meses</h2>
        {tendencia.length === 0 ? (
          <p className="text-sm py-8 text-center" style={{ color: '#9CA3AF' }}>Sin datos suficientes aun</p>
        ) : (
          <div className="flex items-end gap-4 h-40 overflow-x-auto pb-4">
            {tendencia.map((t) => (
              <div key={t.mes} className="flex flex-col items-center gap-1 flex-1 min-w-[60px] group relative">
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                  {formatCLP(t.facturado)} · {t.leads} leads
                </div>
                <div className="w-full flex items-end gap-1 h-32">
                  <div
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${Math.max((t.leads / maxLeads) * 100, 2)}%`,
                      background: '#BFDBFE',
                    }}
                    title={`${t.leads} leads`}
                  />
                  <div
                    className="flex-1 rounded-t transition-all"
                    style={{
                      height: `${Math.max((t.facturado / maxFact) * 100, t.facturado > 0 ? 2 : 0)}%`,
                      background: '#10B981',
                    }}
                    title={formatCLP(t.facturado)}
                  />
                </div>
                <span className="text-xs" style={{ color: '#6B7280' }}>{t.mes}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-4 mt-2">
          <span className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#BFDBFE' }} /> Leads
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
            <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#10B981' }} /> Facturado
          </span>
        </div>
      </div>

      {/* Embudo + Fuentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Embudo */}
        <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>Embudo de Conversion</h2>
          <div className="space-y-3">
            {(m.leads_por_etapa ?? []).map((etapa, i) => {
              const prev = i > 0 ? m.leads_por_etapa[i - 1] : null
              const prevCount = prev?.count ?? 0
              const convRate = prevCount > 0 ? Math.round((etapa.count / prevCount) * 100) : null
              const pct = m.total_leads > 0 ? Math.round((etapa.count / m.total_leads) * 100) : 0
              return (
                <div key={etapa.etapa}>
                  {convRate !== null && (
                    <div className="text-xs mb-1" style={{ color: '#9CA3AF' }}>
                      ↓ {convRate}% paso a {etapa.nombre}
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: etapa.color }} />
                    <span className="text-sm flex-1" style={{ color: '#374151' }}>{etapa.nombre}</span>
                    <span className="text-sm font-semibold w-6 text-right" style={{ color: '#111827' }}>{etapa.count}</span>
                    {etapa.valor > 0 && (
                      <span className="text-xs" style={{ color: '#6B7280' }}>{formatCLP(etapa.valor)}</span>
                    )}
                  </div>
                  <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: '#F1F5F9' }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: etapa.color }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Fuentes */}
        <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>Fuentes de Leads</h2>
          {!m.top_fuentes || m.top_fuentes.length === 0 ? (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Sin datos de fuente aun</p>
          ) : (
            <div className="space-y-3">
              {m.top_fuentes.map((f) => {
                const pct = m.total_leads > 0 ? Math.round((f.count / m.total_leads) * 100) : 0
                return (
                  <div key={f.fuente}>
                    <div className="flex justify-between text-sm mb-1">
                      <span style={{ color: '#374151' }}>{f.fuente}</span>
                      <span style={{ color: '#6B7280' }}>{f.count} <span className="text-xs">({pct}%)</span></span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#F1F5F9' }}>
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#3B82F6' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Top Servicios + Leads Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Servicios */}
        <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#374151' }}>Top Servicios Convertidos</h2>
          {!m.top_servicios || m.top_servicios.length === 0 ? (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Sin conversiones aun</p>
          ) : (
            <div className="space-y-3">
              {m.top_servicios.map((s, i) => (
                <div key={s.servicio} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: '#EFF6FF', color: '#1E40AF' }}>{i + 1}</span>
                  <span className="flex-1 text-sm" style={{ color: '#374151' }}>{s.servicio}</span>
                  <span className="text-xs" style={{ color: '#6B7280' }}>{s.count}x</span>
                  <span className="text-sm font-semibold" style={{ color: '#10B981' }}>{formatCLP(s.valor ?? 0)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Leads Recientes */}
        <div className="bg-white rounded-xl shadow-sm border p-5" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#374151' }}>Leads Recientes</h2>
            <Link href="/crm/leads" className="text-xs font-medium" style={{ color: '#1E40AF' }}>Ver todos →</Link>
          </div>
          {recentLeads.length === 0 ? (
            <p className="text-sm" style={{ color: '#9CA3AF' }}>Sin leads aun</p>
          ) : (
            <div className="space-y-2">
              {recentLeads.map((lead) => {
                const color = etapaColors[lead.etapa] ?? '#6366F1'
                const initials = lead.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
                return (
                  <div key={lead.id} className="flex items-center gap-3 py-1.5 border-b last:border-0" style={{ borderColor: '#F1F5F9' }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: color + '22', color }}>
                      {initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: '#111827' }}>{lead.nombre}</p>
                      <p className="text-xs truncate" style={{ color: '#9CA3AF' }}>{lead.servicio_interes ?? '—'}</p>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: color + '22', color }}>{lead.etapa}</span>
                      <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
                        {formatDistanceToNow(new Date(lead.created_at), { locale: es, addSuffix: true })}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Zeltra Alerts */}
      <div className="space-y-2">
        {(() => {
          const stuckContactado = (m.leads_por_etapa ?? []).find((e) => e.etapa === 'contactado')?.count ?? 0
          const reservasEsteMes = (m.leads_por_etapa ?? []).find((e) => e.etapa === 'reserva_con_deposito')?.count ?? 0
          const perfZeltra = reservasEsteMes * clinicConfig.zeltraFeePerReserva
          const roi = clinicConfig.zeltraMonthlyCost > 0
            ? Math.round((m.facturado_este_mes / clinicConfig.zeltraMonthlyCost) * 100)
            : null

          return (
            <>
              {stuckContactado > 0 && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                  <p className="text-sm" style={{ color: '#92400E' }}>
                    <strong>{stuckContactado}</strong> {stuckContactado === 1 ? 'lead lleva' : 'leads llevan'} +3 dias en &apos;Contactado&apos; sin avanzar — el chatbot puede necesitar seguimiento.
                  </p>
                </div>
              )}
              {reservasEsteMes > 0 && (
                <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                  <Target className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <p className="text-sm" style={{ color: '#064E3B' }}>
                    Este mes: <strong>{reservasEsteMes} {reservasEsteMes === 1 ? 'reserva' : 'reservas'}</strong> · <strong>{formatCLP(perfZeltra)}</strong> en performance para Zeltra.
                  </p>
                </div>
              )}
              {roi !== null && m.facturado_este_mes > 0 && (
                <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <TrendingUp className="w-4 h-4 flex-shrink-0 text-blue-500" />
                  <p className="text-sm" style={{ color: '#1E3A8A' }}>
                    ROI de la clinica este mes: <strong>{roi}%</strong> ({formatCLP(m.facturado_este_mes)} facturado / {formatCLP(clinicConfig.zeltraMonthlyCost)} costo Zeltra).
                  </p>
                </div>
              )}
            </>
          )
        })()}
      </div>

    </div>
  )
}
