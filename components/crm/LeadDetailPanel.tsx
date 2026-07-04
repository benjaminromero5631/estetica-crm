'use client'

import { Lead, EtapaConfig } from '@/lib/types'
import { clinicConfig } from '@/lib/config'
import { X, Phone, Mail, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useState } from 'react'
import { toast } from 'sonner'
import ConfirmModal from './ConfirmModal'

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
  const [showConfirm, setShowConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

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
    setDeleting(true)
    await fetch(`/api/leads/${lead.id}`, { method: 'DELETE' })
    setDeleting(false)
    setShowConfirm(false)
    onDelete(lead.id)
    onClose()
    toast.success('Lead eliminado')
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 md:hidden"
        onClick={onClose}
      />

      {/* Panel — bottom sheet on mobile, side panel on desktop */}
      <div
        className="
          fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-xl flex flex-col
          h-[85vh]
          md:static md:h-full md:w-80 md:rounded-none md:rounded-tl-none md:border-l
        "
        style={{ borderColor: '#E2E8F0' }}
      >
        {/* Drag handle on mobile */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: '#E2E8F0' }}>
          <h2 className="font-semibold truncate" style={{ color: '#1F2937' }}>
            {lead.nombre}
            {lead.lead_num != null && (
              <span className="ml-2 text-xs font-normal" style={{ color: '#9CA3AF' }}>
                Paciente #{lead.lead_num}
              </span>
            )}
          </h2>
          <button
            onClick={onClose}
            style={{ color: '#94A3B8' }}
            className="hover:opacity-70 min-w-[44px] min-h-[44px] flex items-center justify-center"
          >
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
            className="flex-1 text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50 min-h-[44px]"
            style={{ background: clinicConfig.primaryColor }}
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            className="px-4 py-2.5 border rounded-lg text-sm min-h-[44px]"
            style={{ borderColor: '#E2E8F0', color: '#EF4444' }}
          >
            Eliminar
          </button>
        </div>
      </div>

      {showConfirm && (
        <ConfirmModal
          titulo="Eliminar lead"
          mensaje={`¿Eliminar el lead de ${lead.nombre}? Podrás recuperarlo desde la base de datos si fue un error.`}
          confirmando={deleting}
          onConfirm={remove}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </>
  )
}
