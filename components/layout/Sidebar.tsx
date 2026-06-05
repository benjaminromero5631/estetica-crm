'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, GitBranch, BarChart2 } from 'lucide-react'

const navItems = [
  { href: '/crm', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm/pipeline', label: 'Pipeline', icon: GitBranch },
  { href: '/crm/leads', label: 'Leads', icon: Users },
  { href: '/crm/metricas', label: 'Métricas', icon: BarChart2 },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-60 min-h-screen bg-white flex flex-col" style={{ borderRight: '1px solid #E2E8F0' }}>
      <div className="flex items-center gap-2 px-6 py-5" style={{ borderBottom: '1px solid #E2E8F0' }}>
        <span className="font-semibold text-base tracking-tight" style={{ color: '#1E40AF' }}>
          Estética CRM
        </span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <span
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                style={{
                  color: active ? '#1E40AF' : '#64748B',
                  background: active ? '#EFF6FF' : 'transparent',
                  borderLeft: active ? '3px solid #1E40AF' : '3px solid transparent',
                  display: 'flex',
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
