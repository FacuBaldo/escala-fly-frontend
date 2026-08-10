import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../context/useAuth'
import useToast from '../context/useToast'
import getErrorMessage from '../utils/getErrorMessage'

const initialForm = {
  email: '',
  password: '',
}

function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const { showToast } = useToast()
  const [form, setForm] = useState(initialForm)
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setIsLoading(true)

    try {
      await login(form)
      navigate('/users', { replace: true })
    } catch (requestError) {
      showToast({
        message: getErrorMessage(requestError, 'No se pudo iniciar sesion.'),
        type: 'error',
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-white via-emerald-50 to-green-100 px-4 py-10">
      <section className="w-full max-w-md rounded-lg border border-emerald-100 bg-white p-8 shadow-xl shadow-emerald-950/10">
        <div className="mb-8">
          <div className="mb-6 overflow-hidden rounded-lg bg-white">
            <img
              alt="Escala Fly"
              className="h-28 w-full object-cover object-center"
              src="/images/Logo.png"
            />
          </div>
          <h1 className="text-3xl font-bold text-slate-950">Iniciar sesion</h1>
          <p className="mt-2 text-sm text-slate-500">Ingresa tus credenciales para continuar.</p>
        </div>

        <form className="grid gap-5" onSubmit={handleSubmit}>
          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Correo electronico
            <input
              autoComplete="email"
              className="h-11 rounded-md border border-slate-200 bg-white px-3 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
              name="email"
              onChange={handleChange}
              required
              type="email"
              value={form.email}
            />
          </label>

          <label className="grid gap-2 text-sm font-semibold text-slate-700">
            Contrasena
            <div className="relative">
              <input
                autoComplete="current-password"
                className="h-11 w-full rounded-md border border-slate-200 bg-white px-3 pr-11 text-slate-950 outline-none transition focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100"
                name="password"
                onChange={handleChange}
                required
                type={showPassword ? 'text' : 'password'}
                value={form.password}
              />
              <button
                aria-label={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                title={showPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                type="button"
              >
                {showPassword ? (
                  <EyeOff aria-hidden="true" size={18} />
                ) : (
                  <Eye aria-hidden="true" size={18} />
                )}
              </button>
            </div>
          </label>

          <button
            className="h-11 rounded-md bg-emerald-700 px-4 font-bold text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default LoginPage
