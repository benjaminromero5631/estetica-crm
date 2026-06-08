import Sidebar from '@/components/layout/Sidebar'
import PageTransition from '@/components/layout/PageTransition'
import { SidebarProvider } from '@/components/layout/SidebarContext'
import { Toaster } from 'sonner'

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen" style={{ background: '#F0F7FF' }}>
        <Sidebar />
        <main className="flex-1 overflow-auto min-w-0">
          <PageTransition>{children}</PageTransition>
        </main>
        <Toaster richColors />
      </div>
    </SidebarProvider>
  )
}
