'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, Lock } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { toast } from 'sonner'
import { clinicConfig } from '@/lib/config'
import { BloqueoHorario } from '@/lib/types'

const DIAS = [
  { dia_semana: 1, label: 'Lunes' },
  { dia_semana: 2, label: 'Martes' },
  { dia_semana: 3, label: 'Miercoles' },
  { dia_semana: 4, label: 'Jueves' },
  { dia_semana: 5, label: 'Viernes' },
  { dia_semana: 6, label: 'Sabado' },
  { dia_semana: 0, label: 'Domingo' },
]

interface DiaForm {
  dia_semana: number
  activo: boolean
  hora_inicio: string
  hora_fin: string
}

function defaultDias(): DiaForm[] {
  return DIAS.map(d => ({ dia_semana: d.dia_semana, activo: false, hora_inicio: '09:00', hora_fin: '18:00' }))
}

export default function HorariosPage() {
  const [loading, setLoading] = useState(true)
  const [noVinculado, setNoVinculado] = useState(false)
  const [dias, setDias] = useState<DiaForm[]>(defaultDias())
  const [saving, setSaving] = useState(false)

  const [bloqueos, setBloqueos] = useState<BloqueoHorario[]>([])
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [nuevoMotivo, setNuevoMotivo] = useState('')
  const [savingBloqueo, setSavingBloqueo] = useState(false)

  const fetchHorarios = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/horarios')
    const json = await res.json()
    if (json.error === 'NO_VINCULADO') {
      setNoVinculado(true)
    } else if (!res.ok) {
      toast.error('No se pudieron cargar los horarios')
    } else {
      setNoVinculado(false)
      const base = defaultDias()
      for (const h of json.horarios) {
        const row = base.find(d => d.dia_semana === h.dia_semana)
        if (row) {
          row.activo = true
          row.hora_inicio = h.hora_inicio.slice(0, 5)
          row.hora_fin = h.hora_fin.slice(0, 5)
        }
      }
      setDias(base)
    }
    setLoading(false)
  }, [])

  const fetchBloqueos = useCallback(async () => {
    const res = await fetch('/api/bloqueos')
    const json = await res.json()
    if (res.ok) setBloqueos(json.bloqueos)
  }, [])

  useEffect(() => {
    fetchHorarios()
    fetchBloqueos()
  }, [fetchHorarios, fetchBloqueos])

  function updateDia(dia_semana: number, patch: Partial<DiaForm>) {
    setDias(prev => prev.map(d => d.dia_semana === dia_semana ? { ...d, ...patch } : d))
  }

  async function guardarHorarios() {
    setSaving(true)
    try {
      const res = await fetch('/api/horarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dias }),
      })
      if (!res.ok) throw new Error()
      toast.success('Horario actualizado')
    } catch {
      toast.error('No se pudo guardar el horario')
    } finally {
      setSaving(false)
    }
  }

  async function agregarBloqueo() {
    if (!nuevaFecha) return
    setSavingBloqueo(true)
    try {
      const res = await fetch('/api/bloqueos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fecha: nuevaFecha, motivo: nuevoMotivo || null }),
      })
      if (!res.ok) throw new Error()
      setNuevaFecha('')
      setNuevoMotivo('')
      await fetchBloqueos()
      toast.success('Dia bloqueado')
    } catch {
      toast.error('No se pudo bloquear el dia')
    } finally {
      setSavingBloqueo(false)
    }
  }

  async function eliminarBloqueo(id: string) {
    try {
      const res = await fetch(`/api/bloqueos?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      setBloqueos(prev => prev.filter(b => b.id !== id))
      toast.success('Bloqueo eliminado')
    } catch {
      toast.error('No se pudo eliminar el bloqueo')
    }
  }

  if (loading) {
    return (
      <>
        <TopBar title="Horarios" />
        <div className="p-6 text-sm text-slate-500">Cargando...</div>
      </>
    )
  }

  if (noVinculado) {
    return (
      <>
        <TopBar title="Horarios" />
        <div className="p-6">
          <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Tu cuenta no esta vinculada a un profesional.</p>
              <p>Pide al administrador que vincule tu usuario a un registro de profesional para poder gestionar tu horario.</p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Horarios" />
      <div className="p-6 space-y-8 max-w-3xl">
        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Horario recurrente semanal</h2>
          <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
            {DIAS.map(({ dia_semana, label }) => {
              const row = dias.find(d => d.dia_semana === dia_semana)!
              return (
                <div key={dia_semana} className="flex items-center gap-4 px-4 py-3">
                  <button
                    type="button"
                    onClick={() => updateDia(dia_semana, { activo: !row.activo })}
                    className="relative inline-flex h-5 w-9 flex-shrink-0 items-center rounded-full transition-colors"
                    style={{ background: row.activo ? clinicConfig.primaryColor : '#CBD5E1' }}
                  >
                    <span
                      className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform"
                      style={{ transform: row.activo ? 'translateX(18px)' : 'translateX(2px)' }}
                    />
                  </button>
                  <span className="w-24 text-sm text-slate-700">{label}</span>
                  <input
                    type="time"
                    value={row.hora_inicio}
                    disabled={!row.activo}
                    onChange={e => updateDia(dia_semana, { hora_inicio: e.target.value })}
                    className="rounded border border-slate-200 px-2 py-1 text-sm disabled:opacity-40"
                  />
                  <span className="text-slate-400 text-sm">a</span>
                  <input
                    type="time"
                    value={row.hora_fin}
                    disabled={!row.activo}
                    onChange={e => updateDia(dia_semana, { hora_fin: e.target.value })}
                    className="rounded border border-slate-200 px-2 py-1 text-sm disabled:opacity-40"
                  />
                </div>
              )
            })}
          </div>
          <button
            onClick={guardarHorarios}
            disabled={saving}
            className="mt-4 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            style={{ background: clinicConfig.primaryColor }}
          >
            {saving ? 'Guardando...' : 'Guardar horario'}
          </button>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Bloqueos puntuales</h2>
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha</label>
              <input
                type="date"
                value={nuevaFecha}
                onChange={e => setNuevaFecha(e.target.value)}
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
            </div>
            <div className="flex-1 min-w-[160px]">
              <label className="block text-xs text-slate-500 mb-1">Motivo (opcional)</label>
              <input
                type="text"
                value={nuevoMotivo}
                onChange={e => setNuevoMotivo(e.target.value)}
                placeholder="Vacaciones, capacitacion..."
                className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
              />
            </div>
            <button
              onClick={agregarBloqueo}
              disabled={!nuevaFecha || savingBloqueo}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: clinicConfig.primaryColor }}
            >
              Bloquear dia
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
            {bloqueos.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400">No hay bloqueos programados.</p>
            )}
            {bloqueos.map(b => (
              <div key={b.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-slate-700">{b.fecha}</p>
                  {b.motivo && <p className="text-xs text-slate-400">{b.motivo}</p>}
                </div>
                <button onClick={() => eliminarBloqueo(b.id)} className="text-red-500 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
