'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import Pipeline from '@/components/crm/Pipeline'
import LeadDetailPanel from '@/components/crm/LeadDetailPanel'
import NewLeadModal from '@/components/crm/NewLeadModal'
import { Lead, EtapaConfig } from '@/lib/types'
import { clinicConfig } from '@/lib/config'
import { Plus } from 'lucide-react'

export default function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [etapas, setEtapas] = useState<EtapaConfig[]>([])
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

  return (
    <div className="flex h-screen flex-col">
      <TopBar title="Pipeline" />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-6">
          <div className="flex justify-end mb-4">
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: clinicConfig.primaryColor }}
            >
              <Plus className="w-4 h-4" /> Nuevo Lead
            </button>
          </div>
          <Pipeline initialLeads={leads} etapas={etapas} onLeadClick={setSelected} />
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
