'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, GitBranch, BarChart2, History, LogOut, Sparkles, CalendarDays } from 'lucide-react'
import { clinicConfig } from '@/lib/config'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'

const navItems = [
  { href: '/crm',           label: 'Dashboard', icon: LayoutDashboard },
  { href: '/crm/pipeline',  label: 'Pipeline',  icon: GitBranch },
  { href: '/crm/leads',     label: 'Leads',     icon: Users },
  { href: '/crm/metricas',  label: 'Métricas',  icon: BarChart2 },
  { href: '/crm/historial',    label: 'Historial',   icon: History },
  { href: '/crm/calendario',  label: 'Calendario',  icon: CalendarDays },
]

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [logoErr, setLogoErr] = useState(false)

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <aside
      className="group flex flex-col bg-white transition-all duration-200 ease-in-out
                 w-14 lg:w-60 hover:w-60"
      style={{ borderRight: '1px solid #E2E8F0', minHeight: '100vh', flexShrink: 0 }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-3 lg:px-6 py-5 overflow-hidden group-hover:px-6"
        style={{ borderBottom: '1px solid #E2E8F0', transition: 'padding 0.2s' }}
      >
        {!logoErr ? (
          <Image
            src={clinicConfig.logoUrl}
            alt={clinicConfig.name}
            width={28}
            height={28}
            className="rounded-lg flex-shrink-0"
            onError={() => setLogoErr(true)}
          />
        ) : (
          <Sparkles className="w-7 h-7 flex-shrink-0" style={{ color: clinicConfig.primaryColor }} />
        )}
        <span
          className="font-semibold text-sm tracking-tight whitespace-nowrap overflow-hidden
                     max-w-0 opacity-0 lg:max-w-xs lg:opacity-100
                     group-hover:max-w-xs group-hover:opacity-100 transition-all duration-200"
          style={{ color: clinicConfig.primaryColor }}
        >
          {clinicConfig.name}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 lg:px-3 group-hover:px-3 py-4 space-y-0.5" style={{ transition: 'padding 0.2s' }}>
        {navItems.map((item) => {
          const active = pathname === item.href
          const Icon   = item.icon
          return (
            <Link key={item.href} href={item.href}>
              <span
                className="flex items-center gap-3 px-2 lg:px-3 group-hover:px-3 py-2 rounded-lg text-sm transition-all"
                style={{
                  color:       active ? clinicConfig.primaryColor : '#64748B',
                  background:  active ? '#EFF6FF' : 'transparent',
                  borderLeft:  active ? `3px solid ${clinicConfig.primaryColor}` : '3px solid transparent',
                  display: 'flex',
                }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span
                  className="whitespace-nowrap overflow-hidden
                             max-w-0 opacity-0 lg:max-w-xs lg:opacity-100
                             group-hover:max-w-xs group-hover:opacity-100 transition-all duration-200"
                >
                  {item.label}
                </span>
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <div className="px-2 lg:px-3 group-hover:px-3 py-4" style={{ borderTop: '1px solid #E2E8F0', transition: 'padding 0.2s' }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-2 lg:px-3 group-hover:px-3 py-2 rounded-lg text-sm w-full transition-all hover:bg-red-50"
          style={{ color: '#EF4444' }}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          <span
            className="whitespace-nowrap overflow-hidden
                       max-w-0 opacity-0 lg:max-w-xs lg:opacity-100
                       group-hover:max-w-xs group-hover:opacity-100 transition-all duration-200"
          >
            Cerrar sesión
          </span>
        </button>
      </div>
    </aside>
  )
}
