'use client'

import { useEffect, useState } from 'react'
import TopBar from '@/components/layout/TopBar'
import Pipeline from '@/components/crm/Pipeline'
import LeadDetailPanel from '@/components/crm/LeadDetailPanel'
import NewLeadModal from '@/components/crm/NewLeadModal'
import BulkActionBar from '@/components/crm/BulkActionBar'
import ConfirmModal from '@/components/crm/ConfirmModal'
import { Lead, EtapaConfig } from '@/lib/types'
import { clinicConfig } from '@/lib/config'
import { Plus, ListChecks } from 'lucide-react'
import { toast } from 'sonner'

export default function PipelinePage() {
  const [leads, setLeads]     = useState<Lead[]>([])
  const [etapas, setEtapas]   = useState<EtapaConfig[]>([])
  const [selected, setSelected] = useState<Lead | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showConfirmBulk, setShowConfirmBulk] = useState(false)
  const [bulkDeleting, setBulkDeleting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch('/api/leads').then((r) => r.json()),
      fetch('/api/etapas').then((r) => r.json()),
    ]).then(([leadsData, etapasData]) => {
      setLeads(leadsData)
      setEtapas(etapasData)
    })
  }, [])

  function toggleSelectionMode() {
    setSelectionMode((prev) => !prev)
    setSelectedIds(new Set())
  }

  function toggleSelected(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function bulkDelete() {
    setBulkDeleting(true)
    const res = await fetch('/api/leads/bulk-delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: Array.from(selectedIds) }),
    })
    setBulkDeleting(false)
    setShowConfirmBulk(false)
    if (!res.ok) { toast.error('Error al eliminar'); return }
    setLeads((prev) => prev.filter((l) => !selectedIds.has(l.id)))
    toast.success(`${selectedIds.size} lead(s) eliminados`)
    setSelectedIds(new Set())
    setSelectionMode(false)
  }

  return (
    <div className="flex h-screen flex-col">
      <TopBar title="Pipeline" />
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {/* Desktop "Nuevo Lead" button */}
          <div className="hidden md:flex justify-end gap-3 mb-4">
            <button
              onClick={toggleSelectionMode}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border min-h-[44px]"
              style={
                selectionMode
                  ? { background: clinicConfig.primaryColor, color: 'white', borderColor: clinicConfig.primaryColor }
                  : { borderColor: '#E2E8F0', color: '#374151' }
              }
            >
              <ListChecks className="w-4 h-4" /> {selectionMode ? 'Cancelar' : 'Seleccionar'}
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 text-white px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: clinicConfig.primaryColor }}
            >
              <Plus className="w-4 h-4" /> Nuevo Lead
            </button>
          </div>
          {/* Mobile "Seleccionar" button */}
          <div className="md:hidden flex justify-end mb-4">
            <button
              onClick={toggleSelectionMode}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border min-h-[44px]"
              style={
                selectionMode
                  ? { background: clinicConfig.primaryColor, color: 'white', borderColor: clinicConfig.primaryColor }
                  : { borderColor: '#E2E8F0', color: '#374151' }
              }
            >
              <ListChecks className="w-4 h-4" /> {selectionMode ? 'Cancelar' : 'Seleccionar'}
            </button>
          </div>
          <Pipeline
            initialLeads={leads}
            etapas={etapas}
            onLeadClick={setSelected}
            selectionMode={selectionMode}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelected}
          />
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

      {/* FAB — mobile only */}
      <button
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full text-white shadow-lg flex items-center justify-center"
        style={{ background: clinicConfig.primaryColor }}
        aria-label="Nuevo Lead"
      >
        <Plus className="w-6 h-6" />
      </button>

      {showModal && (
        <NewLeadModal
          onClose={() => setShowModal(false)}
          onCreated={(l) => setLeads((prev) => [l, ...prev])}
        />
      )}

      {selectedIds.size > 0 && (
        <BulkActionBar count={selectedIds.size} onDelete={() => setShowConfirmBulk(true)} />
      )}

      {showConfirmBulk && (
        <ConfirmModal
          titulo="Eliminar leads"
          mensaje={`¿Eliminar ${selectedIds.size} lead${selectedIds.size === 1 ? '' : 's'}? Esta acción es reversible solo desde la base de datos.`}
          confirmando={bulkDeleting}
          onConfirm={bulkDelete}
          onCancel={() => setShowConfirmBulk(false)}
        />
      )}
    </div>
  )
}
