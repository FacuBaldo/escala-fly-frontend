import { Trash2 } from 'lucide-react'
import BaseDialog from './BaseDialog'

function DeleteDialog({
  cancelLabel = 'Cancelar',
  confirmLabel = 'Eliminar',
  isDeleting,
  loadingLabel = 'Eliminando...',
  message,
  onClose,
  onConfirm,
  title = 'Eliminar registro',
}) {
  return (
    <BaseDialog
      isBusy={isDeleting}
      labelledBy="delete-dialog-title"
      maxWidth="max-w-md"
      onClose={onClose}
      title={
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-50 text-red-700">
            <Trash2 aria-hidden="true" size={20} />
          </span>
          {title}
        </span>
      }
    >
      <p className="text-sm leading-6 text-slate-600">{message}</p>

      <div className="mt-6 flex flex-wrap justify-end gap-2">
        <button
          className="rounded-md border border-slate-200 bg-white px-4 py-2 font-bold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isDeleting}
          onClick={onClose}
          type="button"
        >
          {cancelLabel}
        </button>

        <button
          className="rounded-md bg-red-700 px-4 py-2 font-bold text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-70"
          disabled={isDeleting}
          onClick={onConfirm}
          type="button"
        >
          {isDeleting ? loadingLabel : confirmLabel}
        </button>
      </div>
    </BaseDialog>
  )
}

export default DeleteDialog
