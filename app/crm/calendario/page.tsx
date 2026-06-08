'use client'

import { useEffect, useState, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Clock, User, Trash2 } from 'lucide-react'
import TopBar from '@/components/layout/TopBar'
import { Cita, Lead } from '@/lib/types'
import { toast } from 'sonner'
import { clinicConfig } from '@/lib/config'

const DAYS   = ['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab']
const MONTHS = [
  'Enero','Febrero','Marzo','Abril','Mayo','Junio',
  'Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'
]

const ESTADO_COLORS: Record<string, string> = {
  pendiente:  '#8b5cf6',
  completada: '#10b981',
  cancelada:  '#ef4444',
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}
function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}
function toISOFromLocal(val: string) {
  return new Date(val).toISOString()
}
function startOfWeek(d: Date): Date {
  const date = new Date(d)
  date.setDate(d.getDate() - d.getDay())
  date.setHours(0, 0, 0, 0)
  return date
}

interface FormState {
  lead_id: string
  titulo: string
  fecha_inicio: string
  fecha_fin: string
  notas: string
}

export default function CalendarioPage() {
  const today = new Date()
  const [year, setYear]   = useState(today.getFullYear())
  const [month, setMonth] = useState(today.getMonth())
  const [citas, setCitas] = useState<Cita[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  // Week view state (mobile)
  const [weekStart, setWeekStart] = useState(() => startOfWeek(today))

  const [showModal, setShowModal]     = useState(false)
  const [selectedDay, setSelectedDay] = useState<Date | null>(null)
  const [detailCita, setDetailCita]   = useState<Cita | null>(null)
  const [saving, setSaving]           = useState(false)

  const defaultForm = (): FormState => {
    const base = selectedDay ?? today
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${base.getFullYear()}-${pad(base.getMonth()+1)}-${pad(base.getDate())}`
    return {
      lead_id: '',
      titulo: '',
      fecha_inicio: `${dateStr}T10:00`,
      fecha_fin: `${dateStr}T11:00`,
      notas: '',
    }
  }
  const [form, setForm] = useState<FormState>(defaultForm)

  const fetchCitas = useCallback(async () => {
    const res = await fetch('/api/citas')
    if (res.ok) setCitas(await res.json())
  }, [])

  const fetchLeads = useCallback(async () => {
    const res = await fetch('/api/leads')
    if (res.ok) setLeads(await res.json())
  }, [])

  useEffect(() => { fetchCitas(); fetchLeads() }, [fetchCitas, fetchLeads])

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
  }
  function prevWeek() {
    setWeekStart(d => { const nd = new Date(d); nd.setDate(d.getDate() - 7); return nd })
  }
  function nextWeek() {
    setWeekStart(d => { const nd = new Date(d); nd.setDate(d.getDate() + 7); return nd })
  }

  function openNewCita(day: Date) {
    setSelectedDay(day)
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${day.getFullYear()}-${pad(day.getMonth()+1)}-${pad(day.getDate())}`
    setForm({ lead_id: '', titulo: '', fecha_inicio: `${dateStr}T10:00`, fecha_fin: `${dateStr}T11:00`, notas: '' })
    setShowModal(true)
  }

  async function handleSave() {
    if (!form.titulo.trim()) { toast.error('El titulo es requerido'); return }
    if (!form.fecha_inicio || !form.fecha_fin) { toast.error('Las fechas son requeridas'); return }
    setSaving(true)
    const res = await fetch('/api/citas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lead_id: form.lead_id || null,
        titulo: form.titulo,
        fecha_inicio: toISOFromLocal(form.fecha_inicio),
        fecha_fin: toISOFromLocal(form.fecha_fin),
        notas: form.notas || null,
      }),
    })
    setSaving(false)
    if (!res.ok) { toast.error('Error al guardar la cita'); return }
    toast.success('Cita creada')
    setShowModal(false)
    fetchCitas()
  }

  async function handleEstado(cita: Cita, estado: string) {
    const res = await fetch(`/api/citas/${cita.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado }),
    })
    if (!res.ok) { toast.error('Error al actualizar'); return }
    toast.success('Estado actualizado')
    setDetailCita(prev => prev ? { ...prev, estado: estado as Cita['estado'] } : null)
    fetchCitas()
  }

  async function handleDelete(cita: Cita) {
    if (!confirm('¿Eliminar esta cita?')) return
    const res = await fetch(`/api/citas/${cita.id}`, { method: 'DELETE' })
    if (!res.ok) { toast.error('Error al eliminar'); return }
    toast.success('Cita eliminada')
    setDetailCita(null)
    fetchCitas()
  }

  const daysInMonth   = getDaysInMonth(year, month)
  const firstDayOfWeek = getFirstDayOfWeek(year, month)
  const totalCells    = Math.ceil((firstDayOfWeek + daysInMonth) / 7) * 7

  function citasForDay(d: Date): Cita[] {
    return citas.filter(c => sameDay(new Date(c.fecha_inicio), d))
  }

  // Week days for mobile view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })

  return (
    <div className="min-h-screen" style={{ background: '#F0F7FF' }}>
      <TopBar title="Calendario" />

      <div className="p-4 md:p-6">

        {/* ── MOBILE: Week view ── */}
        <div className="md:hidden">
          {/* Week nav header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevWeek} className="p-2 rounded-lg hover:bg-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-base font-semibold text-slate-800 text-center">
              {MONTHS[weekDays[0].getMonth()]} {weekDays[0].getFullYear()}
            </h2>
            <button onClick={nextWeek} className="p-2 rounded-lg hover:bg-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Week row — horizontal scroll */}
          <div className="overflow-x-auto">
            <div className="flex gap-2 min-w-max pb-2">
              {weekDays.map((day) => {
                const isToday = sameDay(day, today)
                const dayCitas = citasForDay(day)
                return (
                  <div
                    key={day.toISOString()}
                    onClick={() => openNewCita(day)}
                    className="flex flex-col rounded-xl bg-white border cursor-pointer"
                    style={{
                      borderColor: isToday ? clinicConfig.primaryColor : '#E2E8F0',
                      borderWidth: isToday ? 2 : 1,
                      minWidth: 100,
                      minHeight: 120,
                    }}
                  >
                    {/* Day header */}
                    <div className="px-3 pt-2 pb-1">
                      <p className="text-xs font-semibold" style={{ color: '#94A3B8' }}>{DAYS[day.getDay()]}</p>
                      <span
                        className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-semibold"
                        style={{
                          background: isToday ? clinicConfig.primaryColor : 'transparent',
                          color: isToday ? 'white' : '#334155',
                        }}
                      >
                        {day.getDate()}
                      </span>
                    </div>
                    {/* Citas */}
                    <div className="px-2 pb-2 space-y-1 flex-1">
                      {dayCitas.slice(0, 2).map(c => (
                        <div
                          key={c.id}
                          onClick={e => { e.stopPropagation(); setDetailCita(c) }}
                          className="text-xs px-1.5 py-0.5 rounded text-white truncate"
                          style={{ background: ESTADO_COLORS[c.estado] ?? '#6366f1', maxWidth: 88 }}
                        >
                          {new Date(c.fecha_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      ))}
                      {dayCitas.length > 2 && (
                        <span className="text-xs text-slate-400">+{dayCitas.length - 2}</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Nueva cita button on mobile */}
          <button
            onClick={() => openNewCita(today)}
            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white min-h-[44px]"
            style={{ background: clinicConfig.primaryColor }}
          >
            <Plus className="w-4 h-4" />
            Nueva cita
          </button>
        </div>

        {/* ── DESKTOP: Month view ── */}
        <div className="hidden md:block">
          {/* Header nav */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-white transition-colors">
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h2 className="text-xl font-semibold text-slate-800 min-w-[200px] text-center">
                {MONTHS[month]} {year}
              </h2>
              <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-white transition-colors">
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>
            <button
              onClick={() => openNewCita(today)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90"
              style={{ background: clinicConfig.primaryColor }}
            >
              <Plus className="w-4 h-4" />
              Nueva cita
            </button>
          </div>

          {/* Grid */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden" style={{ border: '1px solid #E2E8F0' }}>
            <div className="grid grid-cols-7">
              {DAYS.map(d => (
                <div key={d} className="py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wide"
                  style={{ borderBottom: '1px solid #E2E8F0' }}>
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {Array.from({ length: totalCells }).map((_, idx) => {
                const dayNum = idx - firstDayOfWeek + 1
                const isCurrentMonth = dayNum >= 1 && dayNum <= daysInMonth
                const cellDate = isCurrentMonth ? new Date(year, month, dayNum) : null
                const isToday = cellDate ? sameDay(cellDate, today) : false
                const dayCitas = cellDate ? citasForDay(cellDate) : []

                return (
                  <div
                    key={idx}
                    onClick={() => isCurrentMonth && openNewCita(new Date(year, month, dayNum))}
                    className="relative min-h-[110px] p-2 transition-colors"
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      borderRight: (idx + 1) % 7 === 0 ? 'none' : '1px solid #F1F5F9',
                      background: isCurrentMonth ? 'white' : '#FAFBFC',
                      cursor: isCurrentMonth ? 'pointer' : 'default',
                    }}
                  >
                    {isCurrentMonth && (
                      <>
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-medium mb-1"
                          style={{
                            background: isToday ? clinicConfig.primaryColor : 'transparent',
                            color: isToday ? 'white' : '#334155',
                          }}
                        >
                          {dayNum}
                        </span>
                        <div className="space-y-1">
                          {dayCitas.slice(0, 3).map(c => (
                            <div
                              key={c.id}
                              onClick={e => { e.stopPropagation(); setDetailCita(c) }}
                              className="text-xs px-2 py-0.5 rounded text-white truncate cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ background: ESTADO_COLORS[c.estado] ?? '#6366f1' }}
                              title={c.titulo}
                            >
                              {new Date(c.fecha_inicio).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })} {c.titulo}
                            </div>
                          ))}
                          {dayCitas.length > 3 && (
                            <span className="text-xs text-slate-400 pl-1">+{dayCitas.length - 3} mas</span>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4">
            {Object.entries(ESTADO_COLORS).map(([estado, color]) => (
              <div key={estado} className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full" style={{ background: color }} />
                <span className="text-xs text-slate-500 capitalize">{estado}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* New cita modal — bottom sheet on mobile, centered on desktop */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-md md:mx-4 overflow-y-auto max-h-[90vh]">
            <div className="p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-semibold text-slate-800">Nueva cita</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-slate-400 hover:text-slate-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Titulo *</label>
                  <input
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 min-h-[44px]"
                    style={{ '--tw-ring-color': clinicConfig.primaryColor } as React.CSSProperties}
                    value={form.titulo}
                    onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
                    placeholder="Ej: Consulta Morpheus8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Lead (opcional)</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none min-h-[44px]"
                    value={form.lead_id}
                    onChange={e => {
                      const lead = leads.find(l => l.id === e.target.value)
                      setForm(f => ({
                        ...f,
                        lead_id: e.target.value,
                        titulo: lead && !f.titulo ? `Cita - ${lead.nombre}` : f.titulo,
                      }))
                    }}
                  >
                    <option value="">Sin lead asociado</option>
                    {leads.map(l => (
                      <option key={l.id} value={l.id}>{l.nombre} - {l.telefono}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Inicio *</label>
                    <input
                      type="datetime-local"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none min-h-[44px]"
                      value={form.fecha_inicio}
                      onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Fin *</label>
                    <input
                      type="datetime-local"
                      className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none min-h-[44px]"
                      value={form.fecha_fin}
                      onChange={e => setForm(f => ({ ...f, fecha_fin: e.target.value }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
                  <textarea
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none resize-none"
                    rows={3}
                    value={form.notas}
                    onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors min-h-[44px]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-60 min-h-[44px]"
                  style={{ background: clinicConfig.primaryColor }}
                >
                  {saving ? 'Guardando...' : 'Guardar cita'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cita detail — bottom sheet on mobile, centered on desktop */}
      {detailCita && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full md:max-w-sm md:mx-4 overflow-y-auto max-h-[90vh]">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span
                    className="inline-block text-xs font-medium px-2 py-0.5 rounded-full text-white mb-2"
                    style={{ background: ESTADO_COLORS[detailCita.estado] }}
                  >
                    {detailCita.estado}
                  </span>
                  <h3 className="text-lg font-semibold text-slate-800">{detailCita.titulo}</h3>
                </div>
                <button
                  onClick={() => setDetailCita(null)}
                  className="text-slate-400 hover:text-slate-600 mt-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>
                    {new Date(detailCita.fecha_inicio).toLocaleString('es-CL', {
                      weekday: 'long', day: 'numeric', month: 'long',
                      hour: '2-digit', minute: '2-digit'
                    })}
                    {' - '}
                    {new Date(detailCita.fecha_fin).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                {detailCita.nombre && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{detailCita.nombre} {detailCita.telefono && `· ${detailCita.telefono}`}</span>
                  </div>
                )}

                {detailCita.servicio_interes && (
                  <div className="text-xs text-slate-400 ml-6">{detailCita.servicio_interes}</div>
                )}

                {detailCita.notas && (
                  <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600 mt-2">
                    {detailCita.notas}
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-5">
                {(['pendiente', 'completada', 'cancelada'] as const).map(e => (
                  <button
                    key={e}
                    onClick={() => handleEstado(detailCita, e)}
                    className="flex-1 text-xs py-2.5 rounded-lg font-medium transition-all min-h-[44px]"
                    style={{
                      background: detailCita.estado === e ? ESTADO_COLORS[e] : '#F1F5F9',
                      color: detailCita.estado === e ? 'white' : '#64748B',
                    }}
                  >
                    {e.charAt(0).toUpperCase() + e.slice(1)}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handleDelete(detailCita)}
                className="flex items-center justify-center gap-2 w-full mt-3 py-2.5 text-xs text-red-500 hover:bg-red-50 rounded-lg transition-colors min-h-[44px]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar cita
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
