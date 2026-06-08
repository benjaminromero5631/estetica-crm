import { createClient } from '@/lib/supabase-server'
import TopBar from '@/components/layout/TopBar'
import { formatCLP } from '@/lib/format'
import HistorialClient from './HistorialClient'

export interface MetricaMensual {
  id: string
  mes: string
  mes_label: string
  total_leads: number
  total_reservas: number
  tasa_conversion: number
  facturado: number
  ticket_promedio: number
  performance_zeltra: number
  leads_perdidos: number
  created_at: string
}

export default async function HistorialPage() {
  const supabase = createClient()

  const [{ data: historial }, { data: metricas }] = await Promise.all([
    supabase
      .from('metricas_mensuales')
      .select('*')
      .order('mes', { ascending: false }),
    supabase.rpc('get_metricas'),
  ])

  const rows = (historial ?? []) as MetricaMensual[]
  const m = metricas as Record<string, number> | null

  // All-time records
  const bestFacturado = rows.reduce<MetricaMensual | null>((best, r) =>
    !best || r.facturado > best.facturado ? r : best, null)
  const bestConversion = rows.reduce<MetricaMensual | null>((best, r) =>
    !best || r.tasa_conversion > best.tasa_conversion ? r : best, null)
  const bestLeads = rows.reduce<MetricaMensual | null>((best, r) =>
    !best || r.total_leads > best.total_leads ? r : best, null)

  // Chart data: last 12 snapshots (oldest first for chart)
  const chartRows = [...rows].reverse().slice(-12)
  const maxLeads = Math.max(...chartRows.map(r => r.total_leads), 1)
  const maxFacturado = Math.max(...chartRows.map(r => r.facturado), 1)

  return (
    <div>
      <TopBar title="Historial Mensual" />
      <div className="p-4 md:p-6 space-y-6">

        {/* Record cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RecordCard
            label="Mejor mes facturado"
            value={bestFacturado ? formatCLP(bestFacturado.facturado) : '—'}
            sub={bestFacturado?.mes_label ?? ''}
            accent="#10B981"
          />
          <RecordCard
            label="Mayor conversión"
            value={bestConversion ? `${bestConversion.tasa_conversion}%` : '—'}
            sub={bestConversion?.mes_label ?? ''}
            accent="#3B82F6"
          />
          <RecordCard
            label="Más leads"
            value={bestLeads ? String(bestLeads.total_leads) : '—'}
            sub={bestLeads?.mes_label ?? ''}
            accent="#8B5CF6"
          />
        </div>

        {/* Evolution chart */}
        <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2E8F0' }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: '#374151' }}>Evolución Mensual</h2>
            <div className="flex items-center gap-4 text-xs" style={{ color: '#6B7280' }}>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#BFDBFE' }} /> Leads
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#6EE7B7' }} /> Reservas
              </span>
            </div>
          </div>

          {chartRows.length < 2 ? (
            <p className="text-sm text-center py-8" style={{ color: '#9CA3AF' }}>
              Aún no hay historial suficiente. El primer snapshot se guardará automáticamente el último día del mes.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <div className="flex items-end gap-2 min-w-0" style={{ height: 160 }}>
                {chartRows.map((r) => {
                  const leadsH = Math.max((r.total_leads / maxLeads) * 140, 4)
                  const reservasH = Math.max((r.total_reservas / maxLeads) * 140, 4)
                  const label = r.mes.substring(2).replace('-', '/')
                  return (
                    <div key={r.mes} className="flex flex-col items-center gap-1 flex-1 min-w-[40px]">
                      <div className="flex items-end gap-0.5 w-full justify-center" style={{ height: 144 }}>
                        <div
                          className="rounded-t w-4"
                          style={{ height: leadsH, background: '#BFDBFE' }}
                          title={`Leads: ${r.total_leads}`}
                        />
                        <div
                          className="rounded-t w-4"
                          style={{ height: reservasH, background: '#6EE7B7' }}
                          title={`Reservas: ${r.total_reservas}`}
                        />
                      </div>
                      <span className="text-[10px]" style={{ color: '#9CA3AF' }}>{label}</span>
                    </div>
                  )
                })}
              </div>
              {/* Facturado sparkline */}
              <div className="mt-3 relative" style={{ height: 40 }}>
                <svg width="100%" height="40" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    points={chartRows.map((r, i) => {
                      const x = (i / (chartRows.length - 1)) * 100
                      const y = 36 - ((r.facturado / maxFacturado) * 32)
                      return `${x}%,${y}`
                    }).join(' ')}
                  />
                  {chartRows.map((r, i) => {
                    const x = (i / (chartRows.length - 1)) * 100
                    const y = 36 - ((r.facturado / maxFacturado) * 32)
                    return <circle key={r.mes} cx={`${x}%`} cy={y} r="3" fill="#10B981" />
                  })}
                </svg>
                <p className="text-[10px] absolute bottom-0 right-0" style={{ color: '#10B981' }}>Facturado</p>
              </div>
            </div>
          )}
        </div>

        {/* Comparison table + manual snapshot button */}
        <HistorialClient
          rows={rows}
          metricas={m}
          cronSecret={process.env.CRON_SECRET!}
        />

      </div>
    </div>
  )
}

function RecordCard({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2E8F0' }}>
      <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: accent }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
  )
}
