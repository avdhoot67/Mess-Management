import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const AdminNavbar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex min-h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 py-3 backdrop-blur sm:px-7">
      <div>
        <p className="text-sm font-semibold text-slate-900">Admin workspace</p>
        <p className="text-xs text-slate-500">Review and manage mess operations</p>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold text-slate-900">{user?.name}</p>
          <p className="text-xs text-slate-500">Administrator</p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-slate-600 transition hover:bg-rose-50 hover:text-rose-700"
        >
          <LogOut size={18} />
          <span className="hidden sm:inline">Log out</span>
        </button>
      </div>
    </header>
  )
}

export default AdminNavbar
