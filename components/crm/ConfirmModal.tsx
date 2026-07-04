'use client'

interface Props {
  titulo: string
  mensaje: string
  confirmando?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ titulo, mensaje, confirmando, onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-5">
        <h3 className="font-semibold text-sm mb-2" style={{ color: '#1F2937' }}>{titulo}</h3>
        <p className="text-sm mb-4" style={{ color: '#4B5563' }}>{mensaje}</p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={confirmando}
            className="px-4 py-2 rounded-lg text-sm border disabled:opacity-50"
            style={{ borderColor: '#E2E8F0', color: '#374151' }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={confirmando}
            className="px-4 py-2 rounded-lg text-sm text-white disabled:opacity-50"
            style={{ background: '#EF4444' }}
          >
            {confirmando ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </div>
    </div>
  )
}
