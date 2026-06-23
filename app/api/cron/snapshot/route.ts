import { serviceClient } from '@/lib/supabase-service'
import { NextResponse } from 'next/server'
import { clinicConfig } from '@/lib/config'

function isLastDayOfMonth(): boolean {
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return tomorrow.getMonth() !== now.getMonth()
}

async function runSnapshot() {
  const supabase = serviceClient()

  const { data: metricas, error: metErr } = await supabase.rpc('get_metricas')
  if (metErr) return NextResponse.json({ error: metErr.message }, { status: 500 })

  const performanceZeltra =
    ((metricas as Record<string, number>)?.convertidos_este_mes ?? 0) *
    clinicConfig.zeltraFeePerReserva

  const { data, error } = await supabase.rpc('guardar_snapshot_mensual', {
    p_performance_zeltra: performanceZeltra,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, snapshot: data })
}

// Vercel cron: runs daily on days 28-31, skip if not last day
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!isLastDayOfMonth()) {
    return NextResponse.json({ skipped: 'Not last day of month' })
  }
  return runSnapshot()
}

// Manual trigger from historial page
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return runSnapshot()
}
