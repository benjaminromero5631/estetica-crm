'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createClient } from '@/lib/supabase'
import { clinicConfig } from '@/lib/config'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      setError('Credenciales incorrectas')
      return
    }
    router.push('/crm')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: '#EFF6FF' }}>
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-sm mx-4 p-8">
        <div className="flex flex-col items-center mb-6">
          <Image
            src={clinicConfig.logoUrl}
            alt={clinicConfig.name}
            width={56}
            height={56}
            className="rounded-xl mb-3"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
          />
          <h1 className="text-xl font-semibold" style={{ color: '#1F2937' }}>Iniciar sesión</h1>
          <p className="text-sm mt-1 text-center" style={{ color: '#6B7280' }}>{clinicConfig.name}</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="correo@ejemplo.com"
              className="w-full border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 min-h-[48px]"
              style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
            />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: '#374151' }}>
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 min-h-[48px]"
              style={{ borderColor: '#E2E8F0', color: '#0F172A' }}
            />
          </div>

          {error && (
            <p className="text-xs text-center" style={{ color: '#DC2626' }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full text-white rounded-lg text-sm font-medium disabled:opacity-50 mt-2 min-h-[48px]"
            style={{ background: clinicConfig.primaryColor }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  )
}
