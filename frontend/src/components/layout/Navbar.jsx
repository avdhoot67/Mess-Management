import { LogOut, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const Navbar = ({ onMenuClick, isMenuOpen }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-3 text-gray-600 hover:bg-gray-100 lg:hidden"
        aria-label="Open sidebar"
        aria-controls="student-sidebar"
        aria-expanded={isMenuOpen}
      >
        <Menu size={22} />
      </button>

      <div className="hidden lg:block">
        <p className="text-sm text-gray-500">
          Student Portal
        </p>
      </div>

      <div className="ml-auto flex items-center gap-3">
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
          aria-label="Log out"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Log out</span>
        </button>

        <div className="flex items-center gap-3 border-l border-gray-200 pl-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-semibold text-gray-900">
              {user?.name}
            </p>
            <p className="text-xs capitalize text-gray-500">
              {user?.role}
            </p>
          </div>

          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 font-semibold text-emerald-700">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Navbar
