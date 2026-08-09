import BaseDialog from './BaseDialog'

function FormDialog({ children, isSaving, onClose, title }) {
  return (
    <BaseDialog
      isBusy={isSaving}
      labelledBy="form-dialog-title"
      onClose={onClose}
      title={title}
    >
      {children}
    </BaseDialog>
  )
}

export default FormDialog
