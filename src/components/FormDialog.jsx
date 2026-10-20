import BaseDialog from './BaseDialog'

function FormDialog({ children, isSaving, maxWidth, onClose, title }) {
  return (
    <BaseDialog
      isBusy={isSaving}
      labelledBy="form-dialog-title"
      maxWidth={maxWidth}
      onClose={onClose}
      title={title}
    >
      {children}
    </BaseDialog>
  )
}

export default FormDialog
