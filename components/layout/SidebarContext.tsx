'use client'

import { createContext, useContext, useState } from 'react'

interface SidebarContextType {
  isOpen: boolean
  toggle: () => void
  close: () => void
}

const SidebarCtx = createContext<SidebarContextType>({
  isOpen: false,
  toggle: () => {},
  close: () => {},
})

export const useSidebar = () => useContext(SidebarCtx)

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <SidebarCtx.Provider value={{
      isOpen,
      toggle: () => setIsOpen(v => !v),
      close: () => setIsOpen(false),
    }}>
      {children}
    </SidebarCtx.Provider>
  )
}
