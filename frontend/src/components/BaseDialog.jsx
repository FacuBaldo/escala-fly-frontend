import { useEffect } from 'react'
import { X } from 'lucide-react'

function BaseDialog({ children, isBusy = false, labelledBy, maxWidth = 'max-w-lg', onClose, title }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) {
        onClose()
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isBusy, onClose])

  return (
    <div
      aria-labelledby={labelledBy}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4"
      role="dialog"
    >
      <div
        className={`max-h-[calc(100vh-2rem)] w-full overflow-y-auto rounded-lg bg-white shadow-2xl shadow-slate-950/20 ${maxWidth}`}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
          <h2 className="text-xl font-bold text-slate-950" id={labelledBy}>
            {title}
          </h2>
          <button
            aria-label="Cerrar dialogo"
            className="flex h-9 w-9 items-center justify-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            disabled={isBusy}
            onClick={onClose}
            title="Cerrar"
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

export default BaseDialog
