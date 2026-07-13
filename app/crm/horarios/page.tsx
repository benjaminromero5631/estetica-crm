'use client'

import { useEffect, useState, useCallback } from 'react'
import { Trash2, Lock, Plus } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { toast } from 'sonner'
import { clinicConfig } from '@/lib/config'
import { BloqueoHorario, ViajeSede } from '@/lib/types'

const DIAS = [
  { dia_semana: 1, label: 'Lunes' },
  { dia_semana: 2, label: 'Martes' },
  { dia_semana: 3, label: 'Miercoles' },
  { dia_semana: 4, label: 'Jueves' },
  { dia_semana: 5, label: 'Viernes' },
  { dia_semana: 6, label: 'Sabado' },
  { dia_semana: 0, label: 'Domingo' },
]

const SEDE_DEFAULT = 'iquique'

interface BloqueForm {
  hora_inicio: string
  hora_fin: string
  duracion_bloque: number
}

interface DiaForm {
  dia_semana: number
  bloques: BloqueForm[]
}

function defaultDias(): DiaForm[] {
  return DIAS.map(d => ({ dia_semana: d.dia_semana, bloques: [] }))
}

function nuevoBloque(): BloqueForm {
  return { hora_inicio: '09:00', hora_fin: '18:00', duracion_bloque: 60 }
}

function sedeLabel(sede: string): string {
  return sede.charAt(0).toUpperCase() + sede.slice(1).replace(/-/g, ' ')
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

  const [viajes, setViajes] = useState<ViajeSede[]>([])
  const [nuevoViajeSede, setNuevoViajeSede] = useState('')
  const [nuevoViajeInicio, setNuevoViajeInicio] = useState('')
  const [nuevoViajeFin, setNuevoViajeFin] = useState('')
  const [nuevoViajeCupo, setNuevoViajeCupo] = useState('')
  const [savingViaje, setSavingViaje] = useState(false)

  const [sedes, setSedes] = useState<string[]>([SEDE_DEFAULT])
  const [sedeActual, setSedeActual] = useState(SEDE_DEFAULT)
  const [nuevaSede, setNuevaSede] = useState('')
  const [addingSede, setAddingSede] = useState(false)

  const fetchHorarios = useCallback(async (sede: string) => {
    setLoading(true)
    const res = await fetch(`/api/horarios?sede=${encodeURIComponent(sede)}`)
    const json = await res.json()
    if (json.error === 'NO_VINCULADO') {
      setNoVinculado(true)
    } else if (!res.ok) {
      toast.error('No se pudieron cargar los horarios')
    } else {
      setNoVinculado(false)
      const base = defaultDias()
      for (const h of json.horarios) {
        const row = base.find((d: DiaForm) => d.dia_semana === h.dia_semana)
        if (row) {
          row.bloques.push({
            hora_inicio: h.hora_inicio.slice(0, 5),
            hora_fin: h.hora_fin.slice(0, 5),
            duracion_bloque: h.duracion_bloque,
          })
        }
      }
      setDias(base)
    }
    setLoading(false)
  }, [])

  const fetchBloqueos = useCallback(async (sede: string) => {
    const res = await fetch(`/api/bloqueos?sede=${encodeURIComponent(sede)}`)
    const json = await res.json()
    if (res.ok) setBloqueos(json.bloqueos)
  }, [])

  const fetchViajes = useCallback(async () => {
    const res = await fetch('/api/viajes')
    const json = await res.json()
    if (res.ok) {
      setViajes(json.viajes)
      const sedesDeViajes: string[] = json.viajes.map((v: ViajeSede) => v.sede)
      setSedes(prev => Array.from(new Set([SEDE_DEFAULT, ...prev, ...sedesDeViajes])))
    }
  }, [])

  useEffect(() => {
    fetchHorarios(sedeActual)
    fetchBloqueos(sedeActual)
  }, [sedeActual, fetchHorarios, fetchBloqueos])

  useEffect(() => {
    fetchViajes()
  }, [fetchViajes])

  function agregarBloqueDia(dia_semana: number) {
    setDias(prev => prev.map(d =>
      d.dia_semana === dia_semana ? { ...d, bloques: [...d.bloques, nuevoBloque()] } : d
    ))
  }

  function actualizarBloqueDia(dia_semana: number, index: number, patch: Partial<BloqueForm>) {
    setDias(prev => prev.map(d =>
      d.dia_semana === dia_semana
        ? { ...d, bloques: d.bloques.map((b, i) => i === index ? { ...b, ...patch } : b) }
        : d
    ))
  }

  function eliminarBloqueDia(dia_semana: number, index: number) {
    setDias(prev => prev.map(d =>
      d.dia_semana === dia_semana
        ? { ...d, bloques: d.bloques.filter((_, i) => i !== index) }
        : d
    ))
  }

  function agregarSede() {
    const s = nuevaSede.trim().toLowerCase().replace(/\s+/g, '-')
    if (!s) return
    setSedes(prev => Array.from(new Set([...prev, s])))
    setSedeActual(s)
    setNuevaSede('')
    setAddingSede(false)
  }

  async function guardarHorarios() {
    setSaving(true)
    try {
      const res = await fetch('/api/horarios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dias, sede: sedeActual }),
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
        body: JSON.stringify({ fecha: nuevaFecha, motivo: nuevoMotivo || null, sede: sedeActual }),
      })
      if (!res.ok) throw new Error()
      setNuevaFecha('')
      setNuevoMotivo('')
      await fetchBloqueos(sedeActual)
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

  async function crearViaje() {
    if (!nuevoViajeSede || !nuevoViajeInicio || !nuevoViajeFin || !nuevoViajeCupo) return
    setSavingViaje(true)
    try {
      const res = await fetch('/api/viajes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sede: nuevoViajeSede.trim().toLowerCase().replace(/\s+/g, '-'),
          fecha_inicio: nuevoViajeInicio,
          fecha_fin: nuevoViajeFin,
          cupo_maximo: Number(nuevoViajeCupo),
        }),
      })
      if (!res.ok) {
        const { error } = await res.json().catch(() => ({ error: '' }))
        throw new Error(error || 'Error')
      }
      setNuevoViajeSede('')
      setNuevoViajeInicio('')
      setNuevoViajeFin('')
      setNuevoViajeCupo('')
      await fetchViajes()
      toast.success('Viaje creado')
    } catch (err) {
      toast.error(err instanceof Error && err.message ? err.message : 'No se pudo crear el viaje')
    } finally {
      setSavingViaje(false)
    }
  }

  async function toggleViajeActivo(viaje: ViajeSede) {
    try {
      const res = await fetch('/api/viajes', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: viaje.id, activo: !viaje.activo }),
      })
      if (!res.ok) throw new Error()
      await fetchViajes()
      toast.success(viaje.activo ? 'Viaje desactivado' : 'Viaje activado')
    } catch {
      toast.error('No se pudo actualizar el viaje')
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
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Sede</h2>
          <div className="flex flex-wrap items-center gap-2">
            {sedes.map(sede => (
              <button
                key={sede}
                onClick={() => setSedeActual(sede)}
                className="rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                style={
                  sedeActual === sede
                    ? { background: clinicConfig.primaryColor, color: 'white' }
                    : { background: '#F1F5F9', color: '#475569' }
                }
              >
                {sedeLabel(sede)}
              </button>
            ))}
            {addingSede ? (
              <span className="flex items-center gap-1">
                <input
                  type="text"
                  autoFocus
                  value={nuevaSede}
                  onChange={e => setNuevaSede(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && agregarSede()}
                  placeholder="Nombre de sede"
                  className="rounded border border-slate-200 px-2 py-1 text-sm"
                />
                <button onClick={agregarSede} className="text-sm font-medium" style={{ color: clinicConfig.primaryColor }}>
                  Agregar
                </button>
              </span>
            ) : (
              <button
                onClick={() => setAddingSede(true)}
                className="flex items-center gap-1 rounded-full px-3 py-1.5 text-sm text-slate-500 border border-dashed border-slate-300 hover:border-slate-400"
              >
                <Plus className="w-3.5 h-3.5" /> Nueva sede
              </button>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Horario recurrente semanal — {sedeLabel(sedeActual)}</h2>
          <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
            {DIAS.map(({ dia_semana, label }) => {
              const row = dias.find(d => d.dia_semana === dia_semana)!
              return (
                <div key={dia_semana} className="flex gap-4 px-4 py-3">
                  <span className="w-24 flex-shrink-0 text-sm text-slate-700 pt-1.5">{label}</span>
                  <div className="flex-1 space-y-2">
                    {row.bloques.length === 0 && (
                      <span className="block text-xs text-slate-400 pt-1.5">Dia libre</span>
                    )}
                    {row.bloques.map((bloque, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="time"
                          value={bloque.hora_inicio}
                          onChange={e => actualizarBloqueDia(dia_semana, index, { hora_inicio: e.target.value })}
                          className="rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                        <span className="text-slate-400 text-sm">a</span>
                        <input
                          type="time"
                          value={bloque.hora_fin}
                          onChange={e => actualizarBloqueDia(dia_semana, index, { hora_fin: e.target.value })}
                          className="rounded border border-slate-200 px-2 py-1 text-sm"
                        />
                        <button
                          type="button"
                          onClick={() => eliminarBloqueDia(dia_semana, index)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => agregarBloqueDia(dia_semana)}
                      className="flex items-center gap-1 text-xs font-medium"
                      style={{ color: clinicConfig.primaryColor }}
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar bloque
                    </button>
                  </div>
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
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Bloqueos puntuales — {sedeLabel(sedeActual)}</h2>
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

        <section>
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Viajes a otras sedes</h2>
          <div className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-white p-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">Sede</label>
              <input
                type="text"
                value={nuevoViajeSede}
                onChange={e => setNuevoViajeSede(e.target.value)}
                placeholder="Puerto Montt"
                className="rounded border border-slate-200 px-2 py-1 text-sm w-32"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={nuevoViajeInicio}
                onChange={e => setNuevoViajeInicio(e.target.value)}
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Fecha fin</label>
              <input
                type="date"
                value={nuevoViajeFin}
                onChange={e => setNuevoViajeFin(e.target.value)}
                className="rounded border border-slate-200 px-2 py-1 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">Cupo maximo</label>
              <input
                type="number"
                min={1}
                value={nuevoViajeCupo}
                onChange={e => setNuevoViajeCupo(e.target.value)}
                className="rounded border border-slate-200 px-2 py-1 text-sm w-24"
              />
            </div>
            <button
              onClick={crearViaje}
              disabled={savingViaje || !nuevoViajeSede || !nuevoViajeInicio || !nuevoViajeFin || !nuevoViajeCupo}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              style={{ background: clinicConfig.primaryColor }}
            >
              Crear viaje
            </button>
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-white divide-y divide-slate-100">
            {viajes.length === 0 && (
              <p className="px-4 py-3 text-sm text-slate-400">No hay viajes programados.</p>
            )}
            {viajes.map(v => (
              <div key={v.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm text-slate-700">
                    {sedeLabel(v.sede)} · {v.fecha_inicio} a {v.fecha_fin}
                  </p>
                  <p className="text-xs text-slate-400">Cupo maximo: {v.cupo_maximo}</p>
                </div>
                <button
                  onClick={() => toggleViajeActivo(v)}
                  className="text-xs font-medium rounded-full px-3 py-1"
                  style={
                    v.activo
                      ? { background: '#DCFCE7', color: '#16A34A' }
                      : { background: '#F1F5F9', color: '#64748B' }
                  }
                >
                  {v.activo ? 'Activo' : 'Inactivo'}
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
