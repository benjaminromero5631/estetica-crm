'use client'

import { Menu } from 'lucide-react'
import { useSidebar } from './SidebarContext'

export default function TopBar({ title }: { title: string }) {
  const { toggle } = useSidebar()
  return (
    <header className="h-14 border-b bg-white flex items-center px-4 md:px-6 sticky top-0 z-20" style={{ borderColor: '#E2E8F0' }}>
      <button
        onClick={toggle}
        className="md:hidden p-2 -ml-1 mr-2 rounded-lg hover:bg-gray-100 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
        aria-label="Abrir menu"
      >
        <Menu className="w-5 h-5 text-slate-600" />
      </button>
      <h1 className="text-lg font-semibold text-zinc-800 flex-1 text-center md:text-left md:flex-none">{title}</h1>
    </header>
  )
}
