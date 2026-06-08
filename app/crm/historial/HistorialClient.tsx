'use client'

import { useState } from 'react'
import { formatCLP } from '@/lib/format'
import type { MetricaMensual } from './page'

interface Props {
  rows: MetricaMensual[]
  metricas: Record<string, number> | null
  cronSecret: string
}

function Arrow({ pct }: { pct: number | null }) {
  if (pct === null) return <span style={{ color: '#9CA3AF' }}>—</span>
  const color = pct > 0 ? '#16A34A' : pct < 0 ? '#DC2626' : '#9CA3AF'
  const arrow = pct > 0 ? '↑' : pct < 0 ? '↓' : ''
  return <span style={{ color }}>{arrow}{Math.abs(pct).toFixed(1)}%</span>
}

function delta(curr: number, prev: number | undefined): number | null {
  if (prev === undefined || prev === 0) return null
  return ((curr - prev) / prev) * 100
}

export default function HistorialClient({ rows, metricas, cronSecret }: Props) {
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const bestMes = rows.reduce<MetricaMensual | null>((best, r) =>
    !best || r.facturado > best.facturado ? r : best, null)

  async function handleSnapshot() {
    setLoading(true)
    setToast(null)
    try {
      const res = await fetch('/api/cron/snapshot', {
        method: 'POST',
        headers: { authorization: `Bearer ${cronSecret}` },
      })
      const json = await res.json()
      if (!res.ok) {
        setToast(`Error: ${json.error}`)
      } else {
        setToast('Snapshot guardado ✓')
        setTimeout(() => window.location.reload(), 1200)
      }
    } catch {
      setToast('Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
      <div className="px-4 py-3 border-b flex items-center justify-between" style={{ borderColor: '#E2E8F0' }}>
        <h2 className="text-sm font-semibold" style={{ color: '#374151' }}>Comparativa por Mes</h2>
        <div className="flex items-center gap-3">
          {toast && (
            <span className="text-xs" style={{ color: toast.startsWith('Error') ? '#DC2626' : '#16A34A' }}>
              {toast}
            </span>
          )}
          <button
            onClick={handleSnapshot}
            disabled={loading}
            className="text-xs border rounded-lg px-3 py-1.5 transition-colors hover:bg-gray-50 disabled:opacity-50"
            style={{ borderColor: '#E2E8F0', color: '#374151' }}
          >
            {loading ? 'Guardando...' : 'Guardar snapshot ahora'}
          </button>
        </div>
      </div>
      <p className="text-xs px-4 pt-2 pb-1" style={{ color: '#9CA3AF' }}>
        Normalmente se guarda automático el último día del mes
      </p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              {[
                { label: 'Mes',               mobile: true  },
                { label: 'Leads',             mobile: false },
                { label: 'Reservas',          mobile: true  },
                { label: 'Conversión %',      mobile: true  },
                { label: 'Facturado',         mobile: true  },
                { label: 'Ticket Prom',       mobile: false },
                { label: 'Performance Zeltra', mobile: false },
              ].map(h => (
                <th
                  key={h.label}
                  className={`text-left text-xs font-semibold py-2 px-3 ${h.mobile ? '' : 'hidden md:table-cell'}`}
                  style={{ color: '#6B7280', borderBottom: '1px solid #E2E8F0' }}
                >
                  {h.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-sm" style={{ color: '#9CA3AF' }}>
                  Sin snapshots aún. El primero se guardará al final de este mes.
                </td>
              </tr>
            )}
            {rows.map((r, i) => {
              const prev = rows[i + 1]
              const isGold = bestMes?.mes === r.mes
              return (
                <tr
                  key={r.mes}
                  style={{
                    borderLeft: isGold ? '3px solid #F59E0B' : '3px solid transparent',
                    background: isGold ? '#FFFBEB' : 'transparent',
                  }}
                >
                  <td className="text-sm py-2 px-3 font-medium" style={{ color: '#374151', borderBottom: '1px solid #F1F5F9' }}>
                    {r.mes_label}
                    {isGold && <span className="ml-1 text-[10px]" style={{ color: '#F59E0B' }}>★ mejor</span>}
                  </td>
                  <Td mobileHidden>{r.total_leads} <Arrow pct={delta(r.total_leads, prev?.total_leads)} /></Td>
                  <Td>{r.total_reservas} <Arrow pct={delta(r.total_reservas, prev?.total_reservas)} /></Td>
                  <Td>
                    <span style={{ color: r.tasa_conversion >= 20 ? '#16A34A' : r.tasa_conversion < 10 ? '#DC2626' : '#F59E0B' }}>
                      {r.tasa_conversion}%
                    </span>
                    {' '}<Arrow pct={delta(r.tasa_conversion, prev?.tasa_conversion)} />
                  </Td>
                  <Td accent="#10B981">{formatCLP(r.facturado)} <Arrow pct={delta(r.facturado, prev?.facturado)} /></Td>
                  <Td mobileHidden>{r.ticket_promedio > 0 ? formatCLP(r.ticket_promedio) : '—'}</Td>
                  <Td mobileHidden accent="#3B82F6">{formatCLP(r.performance_zeltra)}</Td>
                </tr>
              )
            })}

            {/* Fila "Mes actual" con datos en vivo */}
            {metricas && (
              <tr style={{ background: '#F8FAFC', borderTop: '2px solid #E2E8F0' }}>
                <td className="text-sm py-2 px-3 font-medium" style={{ color: '#374151' }}>
                  Mes actual
                  <span className="ml-2 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold">
                    En curso
                  </span>
                </td>
                <Td mobileHidden>{metricas.leads_este_mes ?? 0}</Td>
                <Td>{metricas.convertidos_este_mes ?? 0}</Td>
                <Td>
                  <span style={{ color: '#6B7280' }}>
                    {metricas.leads_este_mes > 0
                      ? ((metricas.convertidos_este_mes / metricas.leads_este_mes) * 100).toFixed(1)
                      : '0.0'}%
                  </span>
                </Td>
                <Td accent="#10B981">{formatCLP(metricas.facturado_este_mes ?? 0)}</Td>
                <Td mobileHidden>{metricas.ticket_promedio > 0 ? formatCLP(metricas.ticket_promedio) : '—'}</Td>
                <Td mobileHidden>—</Td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Td({ children, accent, mobileHidden }: { children: React.ReactNode; accent?: string; mobileHidden?: boolean }) {
  return (
    <td
      className={`text-sm py-2 px-3 ${mobileHidden ? 'hidden md:table-cell' : ''}`}
      style={{ color: accent ?? '#374151', borderBottom: '1px solid #F1F5F9' }}
    >
      {children}
    </td>
  )
}
