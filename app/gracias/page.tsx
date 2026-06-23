'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useState } from 'react'

function GraciasInner() {
  const searchParams = useSearchParams()
  const status = searchParams.get('status')
  const citaId = searchParams.get('citaId')
  const [retrying, setRetrying] = useState(false)
  const [retryError, setRetryError] = useState<string | null>(null)

  const isSuccess = status === 'success'

  async function reintentar() {
    if (!citaId) return
    setRetrying(true)
    setRetryError(null)
    try {
      const res = await fetch('/api/flow/create-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ citaId }),
      })
      if (!res.ok) throw new Error()
      const { redirectUrl } = await res.json()
      window.location.href = redirectUrl
    } catch {
      setRetryError('No se pudo iniciar el pago. Intenta de nuevo o contáctanos.')
      setRetrying(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center mx-auto text-3xl">
            ✓
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">¡Cita agendada y pago confirmado!</h1>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Tu reserva quedó registrada y el pago fue procesado correctamente.
            Nos pondremos en contacto contigo para confirmar los detalles.
          </p>
          <a
            href="/agendar"
            className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-300 hover:text-white transition-colors border border-zinc-700"
          >
            Agendar otra cita
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-amber-600/20 border border-amber-500/30 flex items-center justify-center mx-auto text-3xl">
          !
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">Pago no confirmado</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Tu cita quedó registrada, pero no pudimos confirmar tu pago.
          Por favor intenta el pago de nuevo o contáctanos por WhatsApp.
        </p>
        {retryError && (
          <p className="text-red-400 text-sm">{retryError}</p>
        )}
        {citaId && (
          <button
            onClick={reintentar}
            disabled={retrying}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed rounded-xl text-sm font-semibold transition-colors"
          >
            {retrying ? 'Redirigiendo a pago...' : 'Reintentar pago'}
          </button>
        )}
        <a
          href="/agendar"
          className="inline-block px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-medium text-zinc-300 hover:text-white transition-colors border border-zinc-700"
        >
          Volver al inicio
        </a>
      </div>
    </div>
  )
}

export default function GraciasPage() {
  return (
    <Suspense fallback={null}>
      <GraciasInner />
    </Suspense>
  )
}
