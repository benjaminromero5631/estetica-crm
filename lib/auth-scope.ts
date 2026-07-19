import { createClient } from '@/lib/supabase-server'
import { serviceClient } from '@/lib/supabase-service'

export async function getProfesionalScope() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', profesionalId: null, isAdmin: false }

  const adminEmails = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)

  if (user.email && adminEmails.includes(user.email.toLowerCase())) {
    return { error: null, profesionalId: null, isAdmin: true }
  }

  const svc = serviceClient()
  const { data: profesional, error } = await svc
    .from('profesionales')
    .select('id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (error) return { error: error.message, profesionalId: null, isAdmin: false }
  if (!profesional) return { error: 'NO_VINCULADO', profesionalId: null, isAdmin: false }

  return { error: null, profesionalId: profesional.id as string, isAdmin: false }
}

export async function resolveProfesionalIdForWrite(isAdmin: boolean, profesionalId: string | null) {
  if (!isAdmin) return profesionalId
  const svc = serviceClient()
  const { data } = await svc
    .from('profesionales')
    .select('id')
    .eq('activo', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  return data?.id ?? null
}
