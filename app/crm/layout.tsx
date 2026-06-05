import Sidebar from '@/components/layout/Sidebar'
import PageTransition from '@/components/layout/PageTransition'
import { Toaster } from 'sonner'

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: '#F0F7FF' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <PageTransition>{children}</PageTransition>
      </main>
      <Toaster richColors />
    </div>
  )
}
