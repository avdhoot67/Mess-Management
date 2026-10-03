import { useEffect, useRef } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Utensils,
  CalendarCheck,
  CreditCard,
  CalendarDays,
  MessageSquare,
  UserRound,
  X,
} from 'lucide-react'

const navigation = [
  {
    name: 'Dashboard',
    path: '/student',
    icon: LayoutDashboard,
  },
  {
    name: 'Meals',
    path: '/student/meals',
    icon: Utensils,
  },
  {
    name: 'Bookings',
    path: '/student/bookings',
    icon: CalendarCheck,
  },
  {
    name: 'Subscription',
    path: '/student/subscription',
    icon: CalendarDays,
  },
  {
    name: 'Payments',
    path: '/student/payments',
    icon: CreditCard,
  },
  {
    name: 'Feedback',
    path: '/student/feedback',
    icon: MessageSquare,
  },
  {
    name: 'Account',
    path: '/student/account',
    icon: UserRound,
  },
]

const Sidebar = ({ isOpen, onClose }) => {
  const sidebarRef = useRef(null)
  const lastFocusedElement = useRef(null)

  useEffect(() => {
    if (!isOpen) return undefined

    lastFocusedElement.current = document.activeElement
    const sidebar = sidebarRef.current
    const focusableElements = sidebar?.querySelectorAll(
      'a[href], button:not([disabled])'
    )

    focusableElements?.[0]?.focus()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose()
        return
      }

      if (event.key !== 'Tab' || !focusableElements?.length) return

      const firstElement = focusableElements[0]
      const lastElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault()
        lastElement.focus()
      } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault()
        firstElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      lastFocusedElement.current?.focus?.()
    }
  }, [isOpen, onClose])

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        ref={sidebarRef}
        id="student-sidebar"
        role={isOpen ? 'dialog' : undefined}
        aria-modal={isOpen || undefined}
        aria-label={isOpen ? 'Student navigation' : undefined}
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white/95 backdrop-blur transition-transform duration-300 lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-gray-200 px-5">
          <div>
            <h1 className="text-xl font-bold text-emerald-600">
              Mess<span className="text-gray-900">Mate</span>
            </h1>
            <p className="text-xs text-gray-500">
              Student Portal
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-3 text-gray-500 hover:bg-gray-100 lg:hidden"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navigation.map((item) => {
            const Icon = item.icon

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/student'}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 shadow-sm'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
                  }`
                }
              >
                <Icon size={19} />
                <span>{item.name}</span>
              </NavLink>
            )
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <p className="text-xs text-gray-400">
            Mess Management System
          </p>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
