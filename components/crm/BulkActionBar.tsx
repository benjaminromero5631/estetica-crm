'use client'

import { Trash2 } from 'lucide-react'

interface Props {
  count: number
  onDelete: () => void
}

export default function BulkActionBar({ count, onDelete }: Props) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white rounded-xl shadow-xl border flex items-center gap-3 px-4 py-3" style={{ borderColor: '#E2E8F0' }}>
      <span className="text-sm font-medium" style={{ color: '#1F2937' }}>
        {count} {count === 1 ? 'seleccionado' : 'seleccionados'}
      </span>
      <button
        onClick={onDelete}
        className="flex items-center gap-2 text-white px-3 py-2 rounded-lg text-sm font-medium min-h-[44px]"
        style={{ background: '#EF4444' }}
      >
        <Trash2 className="w-4 h-4" />
        Eliminar seleccionados
      </button>
    </div>
  )
}
