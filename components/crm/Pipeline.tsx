'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { Lead, EtapaConfig } from '@/lib/types'
import { clinicConfig } from '@/lib/config'
import LeadCard from './LeadCard'
import { toast } from 'sonner'

interface ColumnProps {
  etapa: EtapaConfig
  leads: Lead[]
  onCardClick: (l: Lead) => void
  selectionMode: boolean
  selectedIds: Set<string>
  onToggleSelect: (id: string) => void
}

function Column({ etapa, leads, onCardClick, selectionMode, selectedIds, onToggleSelect }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.slug })
  return (
    <div className="flex flex-col flex-shrink-0 w-[280px]">
      <div className="flex items-center justify-between mb-2">
        <span
          className="text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: etapa.color + '22', color: etapa.color }}
        >
          {etapa.nombre}
        </span>
        <span className="text-xs" style={{ color: '#94A3B8' }}>{leads.length}</span>
      </div>
      <div
        ref={setNodeRef}
        className="flex-1 rounded-xl p-2 space-y-2 transition-colors"
        style={
          isOver
            ? { background: '#EFF6FF', border: `2px dashed ${clinicConfig.primaryColor}`, minHeight: '6rem' }
            : { background: '#E8F0FE', minHeight: '6rem' }
        }
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onClick={onCardClick}
              selectionMode={selectionMode}
              selected={selectedIds.has(lead.id)}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </SortableContext>

        {leads.length === 0 && !isOver && (
          <div
            className="flex items-center justify-center h-16 rounded-lg"
            style={{ border: '1.5px dashed #CBD5E1' }}
          >
            <span className="text-xs" style={{ color: '#94A3B8' }}>Sin leads</span>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  initialLeads: Lead[]
  etapas: EtapaConfig[]
  onLeadClick: (l: Lead) => void
  selectionMode?: boolean
  selectedIds?: Set<string>
  onToggleSelect?: (id: string) => void
}

export default function Pipeline({
  initialLeads,
  etapas,
  onLeadClick,
  selectionMode = false,
  selectedIds = new Set(),
  onToggleSelect = () => {},
}: Props) {
  const [leads, setLeads] = useState(initialLeads)
  const [showHint, setShowHint] = useState(true)

  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 3000)
    return () => clearTimeout(t)
  }, [])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const leadId      = active.id as string
    const newEtapaSlug = over.id as string

    if (!etapas.find((e) => e.slug === newEtapaSlug)) return

    const lead = leads.find((l) => l.id === leadId)
    if (!lead || lead.etapa === newEtapaSlug) return

    setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, etapa: newEtapaSlug } : l))

    const res = await fetch(`/api/leads/${leadId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ etapa: newEtapaSlug }),
    })
    if (!res.ok) {
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, etapa: lead.etapa } : l))
      toast.error('Error al mover lead')
    }
  }

  return (
    <div>
      {showHint && (
        <p className="text-xs text-center mb-2 md:hidden" style={{ color: '#94A3B8' }}>
          ← desliza →
        </p>
      )}
      <DndContext sensors={selectionMode ? [] : sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {etapas.map((etapa) => (
            <Column
              key={etapa.slug}
              etapa={etapa}
              leads={leads.filter((l) => l.etapa === etapa.slug)}
              onCardClick={onLeadClick}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              onToggleSelect={onToggleSelect}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}
