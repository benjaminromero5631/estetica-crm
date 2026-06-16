'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

// ── types ────────────────────────────────────────────────────
interface HorarioDisponible {
  id: string
  dia_semana: number
  hora_inicio: string
  hora_fin: string
  duracion_bloque: number
}

// ── helpers ──────────────────────────────────────────────────
function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

function fromMinutes(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function generateSlots(horario: HorarioDisponible): { inicio: string; fin: string }[] {
  const start = toMinutes(horario.hora_inicio)
  const end = toMinutes(horario.hora_fin)
  const step = horario.duracion_bloque
  const slots = []
  for (let t = start; t + step <= end; t += step) {
    slots.push({ inicio: fromMinutes(t), fin: fromMinutes(t + step) })
  }
  return slots
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatDisplayDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number)
  const d = new Date(year, month - 1, day)
  return d.toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
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
export default function AgendarPage() {
  const router = useRouter()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [slots, setSlots] = useState<{ inicio: string; fin: string }[]>([])
  const [selectedSlot, setSelectedSlot] = useState<{ inicio: string; fin: string } | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    setError(null)
    setLoadingSlots(true)

    try {
      const supabase = createClient()
      const date = new Date(viewYear, viewMonth, day)
      const dayOfWeek = date.getDay()

      const { data: horarios, error: hErr } = await supabase
        .from('horarios_disponibles')
        .select('*')
        .eq('dia_semana', dayOfWeek)
        .eq('activo', true)

      if (hErr) throw hErr

      if (!horarios || horarios.length === 0) {
        setSlots([])
        setLoadingSlots(false)
        return
      }

      const { data: citas, error: cErr } = await supabase
        .from('citas')
        .select('hora_inicio')
        .eq('fecha', dateStr)

      if (cErr) throw cErr

      const ocupados = new Set((citas || []).map((c: { hora_inicio: string }) => c.hora_inicio))

      const allSlots = horarios.flatMap((h: HorarioDisponible) => generateSlots(h))
      const available = allSlots.filter(s => !ocupados.has(s.inicio))
      setSlots(available)
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
      const supabase = createClient()

      const { data: profesionales, error: pErr } = await supabase
        .from('profesionales')
        .select('id')
        .eq('activo', true)
        .limit(1)

      if (pErr) throw pErr
      if (!profesionales || profesionales.length === 0) {
        setError('No hay profesionales disponibles en este momento.')
        setConfirming(false)
        return
      }

      const profesional_id = profesionales[0].id

      const { error: iErr } = await supabase.from('citas').insert({
        titulo: 'Reserva online',
        fecha: selectedDate,
        hora_inicio: selectedSlot.inicio,
        hora_fin: selectedSlot.fin,
        pago_confirmado: false,
        profesional_id,
        estado: 'pendiente',
      })

      if (iErr) {
        console.error('Supabase insert error:', iErr)
        setError(`Error Supabase: ${iErr.message} (code: ${iErr.code})`)
        setConfirming(false)
        return
      }

      router.push('/gracias')
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
              const selected = selectedDate === dateStr
              return (
                <button
                  key={day}
                  onClick={() => selectDate(day)}
                  disabled={past}
                  className={`
                    mx-auto w-9 h-9 rounded-full text-sm flex items-center justify-center transition-all
                    ${past ? 'text-zinc-700 cursor-not-allowed' : 'hover:bg-zinc-800 cursor-pointer'}
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
