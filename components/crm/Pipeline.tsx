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
import LeadCard from './LeadCard'
import { toast } from 'sonner'

function Column({ etapa, leads, onCardClick }: { etapa: EtapaConfig; leads: Lead[]; onCardClick: (l: Lead) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: etapa.slug })
  return (
    <div className="flex flex-col w-60 flex-shrink-0">
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
        className="flex-1 min-h-24 rounded-xl p-2 space-y-2 transition-colors"
        style={
          isOver
            ? { background: '#EFF6FF', border: '2px dashed #1E40AF' }
            : { background: '#E8F0FE' }
        }
      >
        <SortableContext items={leads.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} onClick={onCardClick} />
          ))}
        </SortableContext>
      </div>
    </div>
  )
}

interface Props {
  initialLeads: Lead[]
  etapas: EtapaConfig[]
  onLeadClick: (l: Lead) => void
}

export default function Pipeline({ initialLeads, etapas, onLeadClick }: Props) {
  const [leads, setLeads] = useState(initialLeads)

  // Sync when parent fetches data (useState only uses initialLeads on first render)
  useEffect(() => {
    setLeads(initialLeads)
  }, [initialLeads])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return

    const leadId = active.id as string
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
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {etapas.map((etapa) => (
          <Column
            key={etapa.slug}
            etapa={etapa}
            leads={leads.filter((l) => l.etapa === etapa.slug)}
            onCardClick={onLeadClick}
          />
        ))}
      </div>
    </DndContext>
  )
}
