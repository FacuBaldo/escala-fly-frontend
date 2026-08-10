import { CircleAlert, CircleCheck, Info, X } from 'lucide-react'

const toastStyles = {
  error: {
    border: 'border-red-200',
    icon: CircleAlert,
    iconColor: 'text-red-700',
    shadow: 'shadow-red-950/10',
  },
  info: {
    border: 'border-sky-200',
    icon: Info,
    iconColor: 'text-sky-700',
    shadow: 'shadow-sky-950/10',
  },
  success: {
    border: 'border-emerald-200',
    icon: CircleCheck,
    iconColor: 'text-emerald-700',
    shadow: 'shadow-emerald-950/10',
  },
}

function NotificationToast({ message, onClose, type = 'info' }) {
  const styles = toastStyles[type] || toastStyles.info
  const Icon = styles.icon

  return (
    <div
      aria-live="polite"
      className={`fixed bottom-6 left-1/2 z-[60] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-lg border bg-white px-4 py-3 shadow-xl ${styles.border} ${styles.shadow}`}
      role="status"
    >
      <Icon aria-hidden="true" className={`shrink-0 ${styles.iconColor}`} size={21} />
      <p className="min-w-0 flex-1 text-sm font-semibold text-slate-700">{message}</p>
      <button
        aria-label="Cerrar notificacion"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        onClick={onClose}
        title="Cerrar"
        type="button"
      >
        <X aria-hidden="true" size={17} />
      </button>
    </div>
  )
}

export default NotificationToast
