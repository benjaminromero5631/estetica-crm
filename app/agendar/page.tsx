'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

function formatShortDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('es-CL', { day: 'numeric', month: 'long' })
}

function formatTime(time: string): string {
  const [h, m] = time.split(':')
  const hour = parseInt(h)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 || 12
  return `${h12}:${m} ${ampm}`
}

const DAYS = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá']
const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

// ── component ────────────────────────────────────────────────
function AgendarInner() {
  const searchParams = useSearchParams()
  const leadId = searchParams.get('lead_id')
  const sede = searchParams.get('sede') || 'iquique'
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<{ inicio: string; fin: string }[]>([])
  const [profesionalId, setProfesionalId] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<{ inicio: string; fin: string } | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viaje, setViaje] = useState<{ fecha_inicio: string; fecha_fin: string; fecha_limite_evaluacion: string } | null>(null)

  useEffect(() => {
    if (sede === 'iquique') return
    fetch(`/api/public/viaje-activo?sede=${sede}`)
      .then(res => res.json())
      .then(({ viaje }) => setViaje(viaje))
      .catch(() => setViaje(null))
  }, [sede])

  function isOutsideViaje(day: number): boolean {
    if (sede === 'iquique') return false
    if (!viaje || !viaje.fecha_limite_evaluacion) return true
    const dateStr = isoDate(viewYear, viewMonth, day)
    return dateStr > viaje.fecha_limite_evaluacion
  }

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11) }
    else setViewMonth(m => m - 1)
  }

  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0) }
    else setViewMonth(m => m + 1)
  }

  function isPast(day: number): boolean {
    const d = new Date(viewYear, viewMonth, day)
    return d < today
  }

  // Block navigation to past months
  const isCurrentOrFuture = viewYear > today.getFullYear() ||
    (viewYear === today.getFullYear() && viewMonth >= today.getMonth())

  async function selectDate(day: number) {
    if (isPast(day)) return
    const dateStr = isoDate(viewYear, viewMonth, day)
    setSelectedDate(dateStr)
    setSelectedSlot(null)
    setSlots([])
    setProfesionalId(null)
    setError(null)
    setLoadingSlots(true)

    try {
      const res = await fetch(`/api/public/disponibilidad?fecha=${dateStr}&sede=${sede}`)
      if (!res.ok) throw new Error('Error consultando disponibilidad')
      const { slots: available, profesional_id } = await res.json()
      setSlots(available)
      setProfesionalId(profesional_id)
    } catch {
      setError('No se pudieron cargar los horarios. Intenta de nuevo.')
    } finally {
      setLoadingSlots(false)
    }
  }

  async function confirmar() {
    if (!selectedDate || !selectedSlot) return
    setConfirming(true)
    setError(null)

    try {
      if (!profesionalId) {
        setError('No hay profesionales disponibles en este momento.')
        setConfirming(false)
        return
      }

      const citaRes = await fetch('/api/public/citas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          titulo:        'Reserva online',
          fecha:         selectedDate,
          hora_inicio:   selectedSlot.inicio,
          hora_fin:      selectedSlot.fin,
          profesional_id: profesionalId,
          lead_id:       leadId || null,
          sede,
        }),
      })

      if (!citaRes.ok) {
        const { error: msg } = await citaRes.json().catch(() => ({ error: 'Error desconocido' }))
        setError(`Error al crear la cita: ${msg}`)
        setConfirming(false)
        return
      }

      const citaData = await citaRes.json()

      const flowRes = await fetch('/api/flow/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citaId: citaData.id }),
      })

      if (!flowRes.ok) {
        setError('No se pudo iniciar el pago. Intenta de nuevo.')
        setConfirming(false)
        return
      }

      const { redirectUrl } = await flowRes.json()
      window.location.href = redirectUrl
    } catch (err) {
      console.error('Error inesperado:', err)
      setError(`Error inesperado: ${err instanceof Error ? err.message : JSON.stringify(err)}`)
      setConfirming(false)
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center py-10 px-4">
      {/* Header */}
      <div className="w-full max-w-md mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">Agenda tu cita</h1>
        <p className="text-zinc-400 text-sm mt-1">Selecciona una fecha y horario disponible</p>
        {sede === 'puerto-montt' && viaje?.fecha_limite_evaluacion && (
          <p className="text-indigo-400 text-xs mt-3 bg-indigo-950/40 border border-indigo-900 rounded-lg px-3 py-2">
            Agenda tu evaluación virtual antes del {formatShortDate(viaje.fecha_limite_evaluacion)}. El día del procedimiento en Puerto Montt se coordina después de la evaluación.
          </p>
        )}
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Calendar */}
        <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              disabled={!isCurrentOrFuture || (viewYear === today.getFullYear() && viewMonth === today.getMonth())}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ‹
            </button>
            <span className="text-sm font-medium">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              ›
            </button>
          </div>

          {/* Day labels */}
          <div className="grid grid-cols-7 mb-2">
            {DAYS.map(d => (
              <div key={d} className="text-center text-xs text-zinc-500 font-medium py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 gap-y-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dateStr = isoDate(viewYear, viewMonth, day)
              const past = isPast(day)
              const outsideViaje = isOutsideViaje(day)
              const disabled = past || outsideViaje
              const selected = selectedDate === dateStr
              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  disabled={disabled}
                  className={`
                    mx-auto w-9 h-9 rounded-full text-sm flex items-center justify-center transition-all
                    ${disabled ? 'text-zinc-700 cursor-not-allowed' : 'hover:bg-zinc-800 cursor-pointer'}
                    ${selected ? 'bg-indigo-600 text-white font-semibold hover:bg-indigo-600' : ''}
                  `}
                >
                  {day}
                </button>
              )
            })}
          </div>
        </div>

        {/* Slots */}
        {selectedDate && (
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800">
            <p className="text-xs text-zinc-400 uppercase tracking-wide font-medium mb-4">
              {formatDisplayDate(selectedDate)}
            </p>

            {loadingSlots ? (
              <div className="flex justify-center py-6">
                <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : slots.length === 0 ? (
              <p className="text-zinc-500 text-sm text-center py-4">
                No hay horarios disponibles para este día.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {slots.map(slot => {
                  const isSelected = selectedSlot?.inicio === slot.inicio
                  return (
                    <button
                      key={slot.inicio}
                      onClick={() => setSelectedSlot(slot)}
                      className={`
                        py-2.5 rounded-xl text-sm font-medium transition-all border
                        ${isSelected
                          ? 'bg-indigo-600 border-indigo-500 text-white'
                          : 'bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-indigo-500 hover:text-white'
                        }
                      `}
                    >
                      {formatTime(slot.inicio)}
                    </button>
                  )
                })}
              </div>
            )}

            {slots.length > 0 && (
              <p className="text-zinc-500 text-xs mt-4 text-center">
                El depósito de $15.000 reserva tu cupo de evaluación y se descuenta del valor total del tratamiento ($699.990) al confirmar el procedimiento.
              </p>
            )}
          </div>
        )}

        {/* Confirm */}
        {selectedSlot && (
          <div className="bg-zinc-900 rounded-2xl p-5 border border-zinc-800 space-y-4">
            <div className="text-sm text-zinc-300 space-y-1">
              <p>
                <span className="text-zinc-500">Fecha:</span>{' '}
                <span className="capitalize">{formatDisplayDate(selectedDate!)}</span>
              </p>
              <p>
                <span className="text-zinc-500">Horario:</span>{' '}
                {formatTime(selectedSlot.inicio)} – {formatTime(selectedSlot.fin)}
              </p>
            </div>

            {error && (
              <p className="text-red-400 text-sm">{error}</p>
            )}

            <button
              onClick={confirmar}
              disabled={confirming}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors"
            >
              {confirming ? 'Confirmando...' : 'Confirmar cita'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AgendarPage() {
  return (
    <Suspense fallback={null}>
      <AgendarInner />
    </Suspense>
  )
}
