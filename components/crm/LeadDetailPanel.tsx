'use client'

import { Lead, EtapaConfig } from '@/lib/types'
import { clinicConfig } from '@/lib/config'
import { X, Phone, Mail, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  lead: Lead
  etapas: EtapaConfig[]
  onClose: () => void
  onUpdate: (updated: Lead) => void
  onDelete: (id: string) => void
}

export default function LeadDetailPanel({ lead, etapas, onClose, onUpdate, onDelete }: Props) {
  const [notas, setNotas] = useState(lead.notas ?? '')
  const [etapa, setEtapa] = useState(lead.etapa)
  const [saving, setSaving] = useState(false)

  async function save() {
    setSaving(true)
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notas, etapa }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Error al guardar'); return }
    const updated = await res.json()
    onUpdate(updated)
    toast.success('Guardado')
  }

  async function remove() {
    if (!confirm(`Eliminar lead ${lead.nombre}?`)) return
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    onDelete(lead.id)
    onClose()
    toast.success('Lead eliminado')
  }

  return (
    <div className="w-80 min-h-screen bg-white border-l shadow-xl flex flex-col" style={{ borderColor: '#E2E8F0' }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E2E8F0' }}>
        <h2 className="font-semibold truncate" style={{ color: '#1F2937' }}>{lead.nombre}</h2>
        <button onClick={onClose} style={{ color: '#94A3B8' }} className="hover:opacity-70">
          <X className="w-5 h-5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div className="space-y-1 text-sm" style={{ color: '#4B5563' }}>
          {lead.telefono && (
            <div className="flex items-center gap-2"><Phone className="w-4 h-4" style={{ color: clinicConfig.accentColor }} />{lead.telefono}</div>
          )}
          {lead.email && (
            <div className="flex items-center gap-2"><Mail className="w-4 h-4" style={{ color: clinicConfig.accentColor }} />{lead.email}</div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" style={{ color: clinicConfig.accentColor }} />
            {format(new Date(lead.created_at), 'dd MMM yyyy', { locale: es })}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>Etapa</label>
          <select
            value={etapa}
            onChange={(e) => setEtapa(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
            style={{ borderColor: '#E2E8F0' }}
          >
            {etapas.map((e) => (
              <option key={e.slug} value={e.slug}>{e.nombre}</option>
            ))}
          </select>
        </div>

        {lead.servicio_interes && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>Servicio</label>
            <p className="text-sm" style={{ color: '#374151' }}>{lead.servicio_interes}</p>
          </div>
        )}

        {lead.fuente && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>Fuente</label>
            <p className="text-sm" style={{ color: '#374151' }}>{lead.fuente}</p>
          </div>
        )}

        {lead.valor_estimado != null && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>Valor estimado</label>
            <p className="text-sm font-semibold" style={{ color: clinicConfig.primaryColor }}>
              ${lead.valor_estimado.toLocaleString('es-CL')}
            </p>
          </div>
        )}

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: '#6B7280' }}>Notas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={5}
            className="w-full border rounded-lg px-3 py-2 text-sm resize-none"
            style={{ borderColor: '#E2E8F0' }}
            placeholder="Agregar notas..."
          />
        </div>
      </div>
      <div className="p-4 border-t flex gap-2" style={{ borderColor: '#E2E8F0' }}>
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50"
          style={{ background: clinicConfig.primaryColor }}
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
        <button
          onClick={remove}
          className="px-3 py-2 border rounded-lg text-sm"
          style={{ borderColor: '#E2E8F0', color: '#EF4444' }}
        >
          Eliminar
        </button>
      </div>
    </div>
  )
}
