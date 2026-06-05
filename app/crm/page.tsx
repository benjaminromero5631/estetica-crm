import { createClient } from '@/lib/supabase-server'
import TopBar from '@/components/layout/TopBar'
import MetricCards from '@/components/crm/MetricCards'
import StageProgress from '@/components/crm/StageProgress'
import RecentLeads from '@/components/crm/RecentLeads'

export default async function DashboardPage() {
  const supabase = createClient()
  const [{ data: leads }, { data: etapas }] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('etapas_config').select('*').order('orden', { ascending: true }),
  ])

  const allLeads = leads ?? []
  const allEtapas = etapas ?? []

  return (
    <div>
      <TopBar title="Dashboard" />
      <div className="p-6 space-y-6">
        <MetricCards leads={allLeads} etapas={allEtapas} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2">
            <RecentLeads leads={allLeads} etapas={allEtapas} />
          </div>
          <StageProgress leads={allLeads} etapas={allEtapas} />
        </div>
      </div>
    </div>
  )
}
