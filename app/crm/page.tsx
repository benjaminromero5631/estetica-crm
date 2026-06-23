import { serviceClient } from '@/lib/supabase-service'
import TopBar from '@/components/layout/TopBar'
import CEODashboard from '@/components/crm/CEODashboard'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const supabase = serviceClient()

  const [{ data: metricas }, { data: leads }] = await Promise.all([
    supabase.rpc('get_metricas'),
    supabase
      .from('leads')
      .select('id, nombre, servicio_interes, etapa, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  return (
    <div>
      <TopBar title="Dashboard" />
      <CEODashboard metricas={metricas} recentLeads={leads ?? []} />
    </div>
  )
}
