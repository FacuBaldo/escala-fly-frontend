import { useCallback, useEffect, useMemo, useState } from 'react'
import NotificationToast from '../components/NotificationToast'
import ToastContext from './toastContext'

function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)

  const showToast = useCallback(({ message, type = 'info' }) => {
    setToast({
      id: window.crypto?.randomUUID?.() || `${Date.now()}`,
      message,
      type,
    })
  }, [])

  const closeToast = useCallback(() => {
    setToast(null)
  }, [])

  useEffect(() => {
    const handleToast = (event) => {
      showToast(event.detail)
    }

    window.addEventListener('app:toast', handleToast)

    return () => {
      window.removeEventListener('app:toast', handleToast)
    }
  }, [showToast])

  useEffect(() => {
    if (!toast) {
      return undefined
    }

    const timeoutId = window.setTimeout(closeToast, 3500)

    return () => window.clearTimeout(timeoutId)
  }, [closeToast, toast])

  const value = useMemo(
    () => ({
      closeToast,
      showToast,
    }),
    [closeToast, showToast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast && (
        <NotificationToast
          message={toast.message}
          onClose={closeToast}
          type={toast.type}
        />
      )}
    </ToastContext.Provider>
  )
}

export default ToastProvider
