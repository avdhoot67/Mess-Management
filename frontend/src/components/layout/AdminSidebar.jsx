import { useEffect, useRef } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { CalendarCheck, CalendarDays, CreditCard, LayoutDashboard, MessageSquareText, ReceiptText, ShieldCheck, UserRound, UserRoundSearch, UsersRound, Utensils } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', path: '/admin', icon: LayoutDashboard },
  { name: 'Meal schedule', path: '/admin/meals', icon: Utensils },
  { name: 'Mess plans', path: '/admin/plans', icon: ReceiptText },
  { name: 'Subscriptions', path: '/admin/subscriptions', icon: CalendarDays },
  { name: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
  { name: 'Customers', path: '/admin/customers', icon: UserRoundSearch },
  { name: 'Feedback', path: '/admin/feedback', icon: MessageSquareText },
  { name: 'Payment verification', path: '/admin/payments', icon: CreditCard },
  { name: 'Team & access', path: '/admin/team', icon: UsersRound },
  { name: 'Account', path: '/admin/account', icon: UserRound },
]

const AdminSidebar = () => {
  const location = useLocation()
  const activeLinkRef = useRef(null)

  useEffect(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      activeLinkRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [location.pathname])

  return (
  <aside className="flex w-full shrink-0 flex-col border-b border-slate-800 bg-slate-950 text-slate-200 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
    <div className="border-b border-slate-800 px-5 py-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-emerald-500/15 p-2 text-emerald-300">
          <ShieldCheck size={21} />
        </div>
        <div>
          <h1 className="font-bold text-white">MessMate</h1>
          <p className="text-xs text-slate-400">Administration</p>
        </div>
      </div>
    </div>

    <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-col lg:py-5">
      {navigation.map(({ name, path, icon: Icon }) => {
        const isCurrentPath = path === '/admin' ? location.pathname === path : location.pathname.startsWith(path)
        return (
        <NavLink
          key={path}
          to={path}
          ref={isCurrentPath ? activeLinkRef : null}
          end={path === '/admin'}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              isActive
                ? 'bg-emerald-500 text-emerald-950'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Icon size={18} />
          {name}
        </NavLink>
        )
      })}
    </nav>
  </aside>
  )
}

export default AdminSidebar
