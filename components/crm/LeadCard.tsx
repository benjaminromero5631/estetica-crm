'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lead } from '@/lib/types'
import { Phone } from 'lucide-react'

export default function LeadCard({ lead, onClick }: { lead: Lead; onClick: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        borderColor: '#E2E8F0',
      }}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <p className="font-medium text-sm truncate" style={{ color: '#1F2937' }}>{lead.nombre}</p>
      {lead.servicio_interes && (
        <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>{lead.servicio_interes}</p>
      )}
      {lead.valor_estimado != null && (
        <p className="text-xs font-semibold mt-1" style={{ color: '#1E40AF' }}>
          ${lead.valor_estimado.toLocaleString('es-CL')}
        </p>
      )}
      <div className="flex gap-2 mt-2">
        {lead.telefono && (
          <span className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>
            <Phone className="w-3 h-3" /> {lead.telefono}
          </span>
        )}
      </div>
    </div>
  )
}
