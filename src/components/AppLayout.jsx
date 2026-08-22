import { LogOut, Menu, Users, Building2, MapPin, Package, X } from 'lucide-react'
import { LogOut, Menu, Users, Building2, MapPin, Plane, X } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import useAutenticacion from '../context/useAutenticacion'

const menuItems = [
  {
    icon: Users,
    label: 'Usuarios',
    path: '/usuarios',
  },
  {
    icon: Building2,
    label: 'Empresas',
    path: '/empresas',
  },
  {
    icon: MapPin,
    label: 'Campos',
    path: '/campos',
  },
  {
    icon: Package,
    label: 'Productos',
    path: '/productos',
    icon: Plane,
    label: 'Aeronaves',
    path: '/aeronaves',
  },
]

function AppLayout({ children }) {
  const { cerrarSesion, usuario } = useAutenticacion()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 1024,
  )
  const location = useLocation()

  const iniciales = usuario?.email?.slice(0, 2).toUpperCase() || 'EF'

  const handleLogout = () => {
    setIsMenuOpen(false)
    cerrarSesion()
  }

  const toggleSidebar = () => {
    setIsMenuOpen(false)
    setIsSidebarOpen((currentValue) => !currentValue)
  }

  return (
    <div className="min-h-screen bg-[#f7fbf8] text-slate-950">
      <header
        className={`fixed right-0 top-0 z-30 flex h-16 items-center justify-between border-b border-emerald-100 bg-white/95 px-4 backdrop-blur transition-[left] duration-300 sm:px-6 ${
          isSidebarOpen ? 'left-0 lg:left-64' : 'left-0'
        }`}
      >
        <button
          aria-label={isSidebarOpen ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
          className="flex h-9 w-9 items-center justify-center rounded-md text-slate-600 transition hover:bg-emerald-50 hover:text-emerald-800"
          onClick={toggleSidebar}
          title={isSidebarOpen ? 'Ocultar menu lateral' : 'Mostrar menu lateral'}
          type="button"
        >
          <Menu aria-hidden="true" size={21} />
        </button>

        <div className="relative">
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white transition hover:bg-emerald-800"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            type="button"
          >
            {iniciales}
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-3 w-48 rounded-lg border border-emerald-100 bg-white p-2 shadow-xl shadow-emerald-950/10">
              <button
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-bold text-red-700 transition hover:bg-red-50"
                onClick={handleLogout}
                type="button"
              >
                <LogOut aria-hidden="true" size={16} />
                Cerrar sesion
              </button>
            </div>
          )}
        </div>
      </header>

      {isSidebarOpen && (
        <button
          aria-label="Cerrar menu lateral"
          className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-emerald-100 bg-white transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="relative flex h-16 shrink-0 items-center justify-center px-6">
          <img
            alt="Escala Fly"
            className="h-auto w-36 object-contain"
            src="/images/LogoDrawer.png"
          />
          <button
            aria-label="Cerrar menu lateral"
            className="absolute right-4 flex h-8 w-8 items-center justify-center rounded-md text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-800 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
            title="Cerrar menu lateral"
            type="button"
          >
            <X aria-hidden="true" size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-4 py-5">
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)

            return (
              <Link
                to={item.path}
                className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-bold transition ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm shadow-emerald-900/20'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
                }`}
                key={item.label}
              >
                <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </aside>

      <div
        className={`pt-16 transition-[padding] duration-300 ${
          isSidebarOpen ? 'lg:pl-64' : 'lg:pl-0'
        }`}
      >
        <main className="px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  )
}

export default AppLayout
