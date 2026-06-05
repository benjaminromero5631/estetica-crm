import { createClient } from '@/lib/supabase-server'
import TopBar from '@/components/layout/TopBar'
import { formatCLP } from '@/lib/format'

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

function KPICard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: string }) {
  return (
    <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2E8F0' }}>
      <p className="text-xs font-medium" style={{ color: '#6B7280' }}>{label}</p>
      <p className="text-2xl font-bold mt-1" style={{ color: accent ?? '#111827' }}>{value}</p>
      {sub && <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>{sub}</p>}
    </div>
  )
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="text-left text-xs font-semibold py-2 px-3" style={{ color: '#6B7280', borderBottom: '1px solid #E2E8F0' }}>{children}</th>
}
function Td({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <td className={`text-sm py-2 px-3 ${right ? 'text-right' : ''}`} style={{ color: '#374151', borderBottom: '1px solid #F1F5F9' }}>{children}</td>
}

export default async function MetricasPage() {
  const supabase = createClient()
  const { data: metricas } = await supabase.rpc('get_metricas')
  const m = metricas as Metricas | null

  if (!m) {
    return (
      <div>
        <TopBar title="Metricas" />
        <div className="p-6">
          <p className="text-sm" style={{ color: '#9CA3AF' }}>Sin datos. Ejecuta get_metricas() en Supabase.</p>
        </div>
      </div>
    )
  }

  const convColor = m.tasa_conversion >= 20 ? '#16A34A' : m.tasa_conversion < 10 ? '#DC2626' : '#F59E0B'
  const tendencia = m.tendencia_mensual ?? []

  // Per-service data combining top_servicios
  const servicios = m.top_servicios ?? []
  const fuentes = m.top_fuentes ?? []
  const etapas = m.leads_por_etapa ?? []

  return (
    <div>
      <TopBar title="Metricas" />
      <div className="p-6 space-y-6">

        {/* 1. KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <KPICard label="Facturado Este Mes" value={formatCLP(m.facturado_este_mes)} sub={`Anterior: ${formatCLP(m.facturado_mes_anterior)}`} accent="#10B981" />
          <KPICard label="Facturado Esta Semana" value={formatCLP(m.facturado_esta_semana)} />
          <KPICard label="En Pipeline" value={formatCLP(m.valor_en_pipeline)} sub={`${m.leads_en_pipeline} leads activos`} accent="#3B82F6" />
          <KPICard label="Total Leads" value={String(m.total_leads)} sub={`${m.leads_este_mes} este mes`} />
          <KPICard label="Tasa Conversion" value={`${m.tasa_conversion}%`} sub={`${m.total_convertidos} convertidos`} accent={convColor} />
          <KPICard label="Ticket Promedio" value={formatCLP(m.ticket_promedio)} sub="en convertidos" accent="#F59E0B" />
        </div>

        {/* 2. Tabla tendencia mensual */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#374151' }}>Evolucion Mensual — Ultimos 6 meses</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Mes</Th>
                  <Th>Leads</Th>
                  <Th>Convertidos</Th>
                  <Th>Conv %</Th>
                  <Th>Facturado</Th>
                  <Th>Ticket Prom</Th>
                </tr>
              </thead>
              <tbody>
                {tendencia.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-6 text-sm" style={{ color: '#9CA3AF' }}>Sin datos aun</td></tr>
                ) : tendencia.map((t) => {
                  const convPct = t.leads > 0 ? ((t.convertidos / t.leads) * 100).toFixed(1) : '0.0'
                  const ticket = t.convertidos > 0 ? Math.round(t.facturado / t.convertidos) : 0
                  return (
                    <tr key={t.mes}>
                      <Td>{t.mes}</Td>
                      <Td>{t.leads}</Td>
                      <Td>{t.convertidos}</Td>
                      <Td>
                        <span style={{ color: Number(convPct) >= 20 ? '#16A34A' : Number(convPct) < 10 ? '#DC2626' : '#F59E0B' }}>
                          {convPct}%
                        </span>
                      </Td>
                      <Td>{formatCLP(t.facturado)}</Td>
                      <Td>{ticket > 0 ? formatCLP(ticket) : '—'}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 3. Analisis por etapa */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#374151' }}>Analisis por Etapa</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Etapa</Th>
                  <Th>Leads</Th>
                  <Th>% del total</Th>
                  <Th>Valor estimado</Th>
                </tr>
              </thead>
              <tbody>
                {etapas.map((e) => {
                  const pct = m.total_leads > 0 ? ((e.count / m.total_leads) * 100).toFixed(1) : '0.0'
                  return (
                    <tr key={e.etapa}>
                      <Td>
                        <span className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
                          {e.nombre}
                        </span>
                      </Td>
                      <Td>{e.count}</Td>
                      <Td>{pct}%</Td>
                      <Td>{e.valor > 0 ? formatCLP(e.valor) : '—'}</Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* 4. Rendimiento de servicios */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#374151' }}>Rendimiento de Servicios (convertidos)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>#</Th>
                  <Th>Servicio</Th>
                  <Th>Conversiones</Th>
                  <Th>Revenue Total</Th>
                  <Th>Ticket Prom</Th>
                </tr>
              </thead>
              <tbody>
                {servicios.length === 0 ? (
                  <tr><td colSpan={5} className="text-center py-6 text-sm" style={{ color: '#9CA3AF' }}>Sin conversiones aun</td></tr>
                ) : servicios.map((s, i) => (
                  <tr key={s.servicio}>
                    <Td><span style={{ color: '#9CA3AF' }}>{i + 1}</span></Td>
                    <Td>{s.servicio}</Td>
                    <Td>{s.count}</Td>
                    <Td><span style={{ color: '#10B981', fontWeight: 600 }}>{formatCLP(s.valor ?? 0)}</span></Td>
                    <Td>{s.count > 0 ? formatCLP((s.valor ?? 0) / s.count) : '—'}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Rendimiento de fuentes */}
        <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
          <div className="px-4 py-3 border-b" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-sm font-semibold" style={{ color: '#374151' }}>Rendimiento por Fuente</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <Th>Fuente</Th>
                  <Th>Leads</Th>
                  <Th>% del total</Th>
                </tr>
              </thead>
              <tbody>
                {fuentes.length === 0 ? (
                  <tr><td colSpan={3} className="text-center py-6 text-sm" style={{ color: '#9CA3AF' }}>Sin datos de fuente aun</td></tr>
                ) : fuentes.map((f) => {
                  const pct = m.total_leads > 0 ? ((f.count / m.total_leads) * 100).toFixed(1) : '0.0'
                  return (
                    <tr key={f.fuente}>
                      <Td>{f.fuente}</Td>
                      <Td>{f.count}</Td>
                      <Td>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden max-w-[80px]" style={{ background: '#F1F5F9' }}>
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, background: '#3B82F6' }} />
                          </div>
                          <span>{pct}%</span>
                        </div>
                      </Td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
