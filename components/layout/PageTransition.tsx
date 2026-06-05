'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname()
  const [visible, setVisible] = useState(true)
  const prevPath   = useRef(pathname)

  useEffect(() => {
    if (prevPath.current !== pathname) {
      setVisible(false)
      const t = setTimeout(() => {
        prevPath.current = pathname
        setVisible(true)
      }, 80)
      return () => clearTimeout(t)
    }
  }, [pathname])

  return (
    <div
      style={{
        opacity:    visible ? 1 : 0,
        transition: 'opacity 0.15s ease',
      }}
    >
      {children}
    </div>
  )
}
