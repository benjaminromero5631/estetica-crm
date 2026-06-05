'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { Lead } from '@/lib/types'
import { toast } from 'sonner'

const SERVICIOS = [
  'Botox',
  'Rellenos dérmicos',
  'Limpieza facial',
  'Diseño de cejas',
  'Mesoterapia',
  'Depilación láser',
  'Otro',
]

const inputStyle = {
  color: '#0F172A',
  background: '#FFFFFF',
  borderColor: '#E2E8F0',
}

const labelStyle = { color: '#374151' }

export default function NewLeadModal({ onClose, onCreated }: { onClose: () => void; onCreated: (l: Lead) => void }) {
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', servicio_interes: '' })
  const [loading, setLoading] = useState(false)

  function setField(k: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre || !form.telefono) { toast.error('Nombre y teléfono son requeridos'); return }
    setLoading(true)
    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
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
          <h2 className="font-semibold" style={{ color: '#1F2937' }}>Nuevo Lead</h2>
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
              placeholder="Ej: María González"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={labelStyle}>Teléfono *</label>
            <input
              value={form.telefono}
              onChange={setField('telefono')}
              placeholder="+56 9 1234 5678"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={labelStyle}>Email</label>
            <input
              value={form.email}
              onChange={setField('email')}
              placeholder="correo@ejemplo.com"
              type="email"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              style={inputStyle}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={labelStyle}>Servicio de interés</label>
            <select
              value={form.servicio_interes}
              onChange={setField('servicio_interes')}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-700"
              style={inputStyle}
            >
              <option value="" style={{ color: '#94A3B8' }}>Seleccionar servicio...</option>
              {SERVICIOS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-lg py-2 text-sm font-medium disabled:opacity-50 mt-2"
            style={{ background: '#1E40AF' }}
          >
            {loading ? 'Creando...' : 'Crear Lead'}
          </button>
        </form>
      </div>
    </div>
  )
}
