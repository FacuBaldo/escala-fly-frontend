import { LogOut, Menu, Users, Building2, MapPin, Package, Plane } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { ROLES, hasRole } from '../auth/roles'
import useAutenticacion from '../context/useAutenticacion'

const menuItems = [
  {
    icon: Users,
    label: 'Usuarios',
    path: '/usuarios',
    roles: [ROLES.ADMIN, ROLES.ENCARGADO],
  },
  {
    icon: Building2,
    label: 'Empresas',
    path: '/empresas',
    roles: [ROLES.ADMIN],
  },
  {
    icon: MapPin,
    label: 'Campos',
    path: '/campos',
    roles: [ROLES.ADMIN, ROLES.ENCARGADO],
  },
  {
    icon: Plane,
    label: 'Aeronaves',
    path: '/aeronaves',
    roles: [ROLES.ADMIN, ROLES.ENCARGADO],
  },
  {
    icon: Package,
    label: 'Productos',
    path: '/productos',
    roles: [ROLES.ADMIN, ROLES.ENCARGADO],
  },
]

function AppLayout({ children }) {
  const { cerrarSesion, usuario } = useAutenticacion()
  const [isSidebarOpen, setIsSidebarOpen] = useState(
    () => window.innerWidth >= 1024,
  )
  const location = useLocation()

  const iniciales = usuario?.email?.slice(0, 2).toUpperCase() || 'EF'
  const visibleMenuItems = menuItems.filter((item) => hasRole(usuario, item.roles))

  const toggleSidebar = () => {
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

        <span
          aria-label={usuario?.email ? `Usuario: ${usuario.email}` : 'Usuario'}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white"
          title={usuario?.email}
        >
          {iniciales}
        </span>
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
        <div className="flex h-16 shrink-0 items-center justify-center px-6">
          <img
            alt="Escala Fly"
            className="h-auto w-36 object-contain"
            src="/images/LogoDrawer.png"
          />
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-4 py-5">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname.startsWith(item.path)

            return (
              <Link
                to={item.path}
                onClick={() => {
                  if (window.innerWidth < 1024) setIsSidebarOpen(false)
                }}
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

        <div className="shrink-0 border-t border-emerald-100 px-4 py-4">
          <button
            className="flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-50"
            onClick={cerrarSesion}
            type="button"
          >
            <LogOut aria-hidden="true" size={18} strokeWidth={2.2} />
            Cerrar sesión
          </button>
        </div>
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
