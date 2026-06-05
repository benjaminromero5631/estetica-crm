'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Lead } from '@/lib/types'
import { clinicConfig } from '@/lib/config'
import { toast } from 'sonner'

const inputStyle = {
  color: '#0F172A',
  background: '#FFFFFF',
  borderColor: '#E2E8F0',
}
const labelStyle = { color: '#374151' }

const ULTIMA_VEZ_OPTIONS = [
  'Nunca',
  'Hace mas de 1 ano',
  'Hace 6 meses',
  'Recientemente',
]

export default function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (l: Lead) => void }) {
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    fuente: '',
    ultima_vez_clinica: '',
    notas: '',
  })
  const [loading, setLoading] = useState(false)

  function setField(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.telefono) { toast.error('Nombre y telefono son requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        servicio_interes: clinicConfig.mainService,
        valor_estimado: clinicConfig.mainServicePrice,
      }),
    })
    setLoading(false)
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Error desconocido' }))
      toast.error(error ?? 'Error al crear lead')
      return
    }
    const lead = await res.json()
    onCreated(lead)
    onClose()
    toast.success('Lead creado')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold" style={{ color: '#1F2937' }}>Nuevo Lead</h2>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              {clinicConfig.mainService} · ${clinicConfig.mainServicePrice.toLocaleString('es-CL')} CLP
            </p>
          </div>
          <button onClick={onClose} style={{ color: '#94A3B8' }} className="hover:opacity-70">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">

          <div>
            <label className="text-xs font-medium block mb-1" style={labelStyle}>Nombre *</label>
            <input
              value={form.nombre}
              onChange={setField('nombre')}
              placeholder="Ej: Maria Gonzalez"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={labelStyle}>Telefono (WhatsApp) *</label>
            <input
              value={form.telefono}
              onChange={setField('telefono')}
              placeholder="+56 9 1234 5678"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={labelStyle}>
              &iquest;Cuando fue tu ultima vez en una clinica estetica?
            </label>
            <select
              value={form.ultima_vez_clinica}
              onChange={setField('ultima_vez_clinica')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              style={inputStyle}
            >
              <option value="">Seleccionar...</option>
              {ULTIMA_VEZ_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={labelStyle}>&iquest;Como nos conociste?</label>
            <select
              value={form.fuente}
              onChange={setField('fuente')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              style={inputStyle}
            >
              <option value="">Seleccionar fuente...</option>
              {clinicConfig.sources.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={labelStyle}>Notas internas</label>
            <textarea
              value={form.notas}
              onChange={setField('notas')}
              placeholder="Observaciones del equipo..."
              rows={2}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700 resize-none"
              style={inputStyle}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 mt-2"
            style={{ background: clinicConfig.primaryColor }}
          >
            {loading ? 'Creando...' : 'Crear Lead'}
          </button>
        </form>
      </div>
    </div>
  )
}
