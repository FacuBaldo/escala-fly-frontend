import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import AutenticacionProvider from './context/AutenticacionProvider.jsx'
import ToastProvider from './context/ToastProvider.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <AutenticacionProvider>
          <App />
        </AutenticacionProvider>
      </ToastProvider>
    </BrowserRouter>
  </StrictMode>,
)
