'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import { LayoutDashboard, Users, GitBranch, BarChart2, History, LogOut, Sparkles, CalendarDays, Clock } from 'lucide-react'
import { clinicConfig } from '@/lib/config'
import { createClient } from '@/lib/supabase'
import { useState } from 'react'
import { useSidebar } from './SidebarContext'

const navItems = [
  { href: '/crm',            label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/crm/pipeline',   label: 'Pipeline',   icon: GitBranch },
  { href: '/crm/leads',      label: 'Leads',      icon: Users },
  { href: '/crm/metricas',   label: 'Métricas',   icon: BarChart2 },
  { href: '/crm/historial',  label: 'Historial',  icon: History },
  { href: '/crm/calendario', label: 'Calendario', icon: CalendarDays },
  { href: '/crm/horarios',   label: 'Horarios',   icon: Clock },
]

export default function Sidebar() {
  const pathname  = usePathname()
  const router    = useRouter()
  const [logoErr, setLogoErr] = useState(false)
  const { isOpen, close } = useSidebar()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={close}
        />
      )}

      <aside
        className={[
          'flex flex-col bg-white group',
          // Mobile: fixed overlay, always w-60
          'fixed inset-y-0 left-0 z-40 w-60',
          'transition-transform duration-200 ease-in-out',
          // md+: static in flex flow, collapsible
          'md:static md:inset-y-auto md:left-auto md:z-auto',
          'md:w-14 lg:w-60',
          'md:transition-all md:duration-200',
          // Mobile open/close via translate
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // md+: always visible
          'md:translate-x-0',
        ].join(' ')}
        style={{ borderRight: '1px solid #E2E8F0', minHeight: '100vh', flexShrink: 0 }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 px-6 md:px-3 lg:px-6 py-5 overflow-hidden md:group-hover:px-6"
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
            className="font-semibold text-sm tracking-tight whitespace-nowrap overflow-hidden transition-all duration-200
                       max-w-xs opacity-100
                       md:max-w-0 md:opacity-0
                       lg:max-w-xs lg:opacity-100
                       md:group-hover:max-w-xs md:group-hover:opacity-100"
            style={{ color: clinicConfig.primaryColor }}
          >
            {clinicConfig.name}
          </span>
        </div>

        {/* Nav */}
        <nav
          className="flex-1 px-3 md:px-2 lg:px-3 md:group-hover:px-3 py-4 space-y-0.5"
          style={{ transition: 'padding 0.2s' }}
        >
          {navItems.map((item) => {
            const active = pathname === item.href
            const Icon   = item.icon
            return (
              <Link key={item.href} href={item.href} onClick={close}>
                <span
                  className="flex items-center gap-3 px-3 md:px-2 lg:px-3 md:group-hover:px-3 py-2 rounded-lg text-sm transition-all"
                  style={{
                    color:      active ? clinicConfig.primaryColor : '#64748B',
                    background: active ? '#EFF6FF' : 'transparent',
                    borderLeft: active ? `3px solid ${clinicConfig.primaryColor}` : '3px solid transparent',
                    display: 'flex',
                  }}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span
                    className="whitespace-nowrap overflow-hidden transition-all duration-200
                               max-w-xs opacity-100
                               md:max-w-0 md:opacity-0
                               lg:max-w-xs lg:opacity-100
                               md:group-hover:max-w-xs md:group-hover:opacity-100"
                  >
                    {item.label}
                  </span>
                </span>
              </Link>
            )
          })}
        </nav>

        {/* Logout */}
        <div
          className="px-3 md:px-2 lg:px-3 md:group-hover:px-3 py-4"
          style={{ borderTop: '1px solid #E2E8F0', transition: 'padding 0.2s' }}
        >
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 md:px-2 lg:px-3 md:group-hover:px-3 py-2 rounded-lg text-sm w-full transition-all hover:bg-red-50"
            style={{ color: '#EF4444' }}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <span
              className="whitespace-nowrap overflow-hidden transition-all duration-200
                         max-w-xs opacity-100
                         md:max-w-0 md:opacity-0
                         lg:max-w-xs lg:opacity-100
                         md:group-hover:max-w-xs md:group-hover:opacity-100"
            >
              Cerrar sesión
            </span>
          </button>
        </div>
      </aside>
    </>
  )
}
