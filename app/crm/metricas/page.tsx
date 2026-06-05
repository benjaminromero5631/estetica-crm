import { createClient } from '@/lib/supabase-server'
import { clinicConfig } from '@/lib/config'
import TopBar from '@/components/layout/TopBar'
import MetricCards from '@/components/crm/MetricCards'
import StageProgress from '@/components/crm/StageProgress'

export default async function MetricasPage() {
  const supabase = createClient()
  const [{ data: leads }, { data: etapas }] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('etapas_config').select('*').order('orden', { ascending: true }),
  ])

  const allLeads = leads ?? []
  const allEtapas = etapas ?? []

  const byMonth: Record<string, number> = {}
  allLeads.forEach((l) => {
    const month = new Date(l.created_at).toLocaleDateString('es-CL', { month: 'short', year: '2-digit' })
    byMonth[month] = (byMonth[month] ?? 0) + 1
  })

  return (
    <div>
      <TopBar title="Métricas" />
      <div className="p-6 space-y-6">
        <MetricCards leads={allLeads} etapas={allEtapas} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <StageProgress leads={allLeads} etapas={allEtapas} />
          <div className="bg-white rounded-xl border p-4" style={{ borderColor: '#E2E8F0' }}>
            <h2 className="text-sm font-semibold mb-3" style={{ color: '#374151' }}>Leads por mes</h2>
            <div className="space-y-2">
              {Object.entries(byMonth).map(([month, count]) => (
                <div key={month}>
                  <div className="flex justify-between text-xs mb-1" style={{ color: '#6B7280' }}>
                    <span>{month}</span>
                    <span>{count}</span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: '#E5E7EB' }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((count / allLeads.length) * 100, 100)}%`,
                        background: clinicConfig.accentColor,
                      }}
                    />
                  </div>
                </div>
              ))}
              {Object.keys(byMonth).length === 0 && (
                <p className="text-sm" style={{ color: '#9CA3AF' }}>Sin datos aun.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
