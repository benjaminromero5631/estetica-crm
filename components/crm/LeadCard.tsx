'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Lead } from '@/lib/types'
import { clinicConfig } from '@/lib/config'
import { CheckCircle, MessageCircle } from 'lucide-react'
import { formatDistanceToNow, differenceInDays } from 'date-fns'
import { es } from 'date-fns/locale'

export default function LeadCard({ lead, onClick }: { lead: Lead; onClick: (l: Lead) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: lead.id,
  })

  const isReserva  = lead.etapa === 'reserva_con_deposito'
  const daysInStage = differenceInDays(new Date(), new Date(lead.updated_at ?? lead.created_at))
  const isStuck    = daysInStage >= 3 && !isReserva && lead.etapa !== 'perdido'

  const waNumber = lead.telefono.replace(/\D/g, '')

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        borderColor: isReserva ? '#10b981' : isStuck ? '#f59e0b' : '#E2E8F0',
        borderWidth: isReserva || isStuck ? 2 : 1,
      }}
      {...attributes}
      {...listeners}
      onClick={() => onClick(lead)}
      className="bg-white rounded-lg border p-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-1">
        <p className="font-medium text-sm truncate" style={{ color: '#1F2937' }}>{lead.nombre}</p>
        {isReserva && (
          <CheckCircle className="w-4 h-4 flex-shrink-0 text-emerald-500" />
        )}
      </div>

      {/* Phone */}
      <p className="text-xs mt-0.5 truncate" style={{ color: '#6B7280' }}>{lead.telefono}</p>

      {/* Reserva badge */}
      {isReserva && (
        <div className="mt-2 flex items-center gap-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#D1FAE5', color: '#065F46' }}>
            ${clinicConfig.zeltraFeePerReserva.toLocaleString('es-CL')} Zeltra
          </span>
        </div>
      )}

      {/* Valor estimado */}
      {!isReserva && lead.valor_estimado != null && lead.valor_estimado > 0 && (
        <p className="text-xs font-semibold mt-1.5" style={{ color: '#16A34A' }}>
          ${lead.valor_estimado.toLocaleString('es-CL')} CLP
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between mt-2 gap-2">
        {lead.fuente ? (
          <span className="text-xs truncate" style={{ color: '#94A3B8' }}>{lead.fuente}</span>
        ) : <span />}

        <div className="flex items-center gap-2 flex-shrink-0">
          {isStuck && (
            <span className="text-xs font-medium px-1.5 py-0.5 rounded" style={{ background: '#FEF3C7', color: '#92400E' }}>
              {daysInStage}d
            </span>
          )}

          {/* WhatsApp — min 44px tap target */}
          <a
            href={`https://wa.me/${waNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center w-11 h-11 rounded-full transition-opacity hover:opacity-80 -mr-1 -mb-1"
            style={{ background: '#25D36615', color: '#25D366' }}
            title="Abrir WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Time ago */}
      <p className="text-xs mt-1" style={{ color: '#CBD5E1' }}>
        {formatDistanceToNow(new Date(lead.created_at), { locale: es, addSuffix: true })}
      </p>
    </div>
  )
}
