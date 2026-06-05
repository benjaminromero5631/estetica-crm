'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lead } from '@/lib/types'
import { clinicConfig } from '@/lib/config'
import { Globe, MessageCircle, UserCheck, Hash } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { es } from 'date-fns/locale'

const FUENTE_ICON: Record<string, React.ReactNode> = {
  instagram: <Hash className="w-3 h-3" />,
  web:       <Globe className="w-3 h-3" />,
  whatsapp:  <MessageCircle className="w-3 h-3" />,
  referido:  <UserCheck className="w-3 h-3" />,
}

export default function LeadCard({ lead, onClick }: { lead: Lead; onClick: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })

  const fuenteKey = lead.fuente?.toLowerCase() ?? ''
  const fuenteIcon = FUENTE_ICON[fuenteKey] ?? null

  const timeAgo = formatDistanceToNow(new Date(lead.created_at), { locale: es, addSuffix: true })

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
        <span
          className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1"
          style={{ background: clinicConfig.primaryColor + '18', color: clinicConfig.primaryColor }}
        >
          {lead.servicio_interes}
        </span>
      )}

      {lead.valor_estimado != null && lead.valor_estimado > 0 && (
        <p className="text-xs font-semibold mt-1.5" style={{ color: '#16A34A' }}>
          ${lead.valor_estimado.toLocaleString('es-CL')} CLP
        </p>
      )}

      <div className="flex items-center justify-between mt-2">
        {fuenteIcon ? (
          <span className="flex items-center gap-1 text-xs" style={{ color: '#94A3B8' }}>
            {fuenteIcon}
            <span className="capitalize">{lead.fuente}</span>
          </span>
        ) : <span />}
        <span className="text-xs" style={{ color: '#CBD5E1' }}>{timeAgo}</span>
      </div>
    </div>
  )
}
