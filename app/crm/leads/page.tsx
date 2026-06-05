'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import LeadDetailPanel from '@/components/crm/LeadDetailPanel'
import NewLeadModal from '@/components/crm/NewLeadModal'
import { Lead, EtapaConfig } from '@/lib/types'
import { Plus, Search } from 'lucide-react'

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [etapas, setEtapas] = useState<EtapaConfig[]>([])
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Lead | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then((r) => r.json()),
      fetch('/api/etapas').then((r) => r.json()),
    ]).then(([leadsData, etapasData]) => {
      setLeads(leadsData)
      setEtapas(etapasData)
    })
  }, [])

  const filtered = leads.filter(
    (l) =>
      l.nombre.toLowerCase().includes(search.toLowerCase()) ||
      l.telefono.includes(search) ||
      (l.servicio_interes ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex h-screen flex-col">
      <TopBar title="Leads" />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="flex gap-3 mb-4">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-2.5" style={{ color: '#94A3B8' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar..."
                className="pl-9 pr-3 py-2 border rounded-lg text-sm w-full"
                style={{ borderColor: '#E2E8F0' }}
              />
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: '#1E40AF' }}
            >
              <Plus className="w-4 h-4" /> Nuevo Lead
            </button>
          </div>
          <div className="bg-white rounded-xl border overflow-hidden" style={{ borderColor: '#E2E8F0' }}>
            <table className="w-full text-sm">
              <thead style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
                <tr>
                  {['Nombre', 'Telefono', 'Servicio', 'Etapa', 'Valor', 'Fecha'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold uppercase" style={{ color: '#64748B' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const etapaObj = etapas.find((e) => e.slug === lead.etapa)
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => setSelected(lead)}
                      className="border-b last:border-0 cursor-pointer hover:bg-blue-50 transition-colors"
                      style={{ borderColor: '#F1F5F9' }}
                    >
                      <td className="px-4 py-3 font-medium" style={{ color: '#1F2937' }}>{lead.nombre}</td>
                      <td className="px-4 py-3" style={{ color: '#4B5563' }}>{lead.telefono}</td>
                      <td className="px-4 py-3" style={{ color: '#6B7280' }}>{lead.servicio_interes ?? '-'}</td>
                      <td className="px-4 py-3">
                        {etapaObj && (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ background: etapaObj.color + '22', color: etapaObj.color }}
                          >
                            {etapaObj.nombre}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold" style={{ color: '#1E40AF' }}>
                        {lead.valor_estimado != null ? `$${lead.valor_estimado.toLocaleString('es-CL')}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs" style={{ color: '#9CA3AF' }}>
                        {new Date(lead.created_at).toLocaleDateString('es-CL')}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-sm" style={{ color: '#9CA3AF' }}>No hay leads</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {selected && (
          <LeadDetailPanel
            lead={selected}
            etapas={etapas}
            onClose={() => setSelected(null)}
            onUpdate={(u) => {
              setLeads((prev) => prev.map((l) => l.id === u.id ? u : l))
              setSelected(u)
            }}
            onDelete={(id) => setLeads((prev) => prev.filter((l) => l.id !== id))}
          />
        )}
      </div>
      {showModal && (
        <NewLeadModal
          onClose={() => setShowModal(false)}
          onCreated={(l) => setLeads((prev) => [l, ...prev])}
        />
      )}
    </div>
  )
}
