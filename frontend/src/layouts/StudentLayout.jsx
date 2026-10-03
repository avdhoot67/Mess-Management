import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../components/layout/Sidebar'
import Navbar from '../components/layout/Navbar'


const StudentLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="workspace-ambient min-h-screen">
      <div className="flex min-h-screen">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar
            onMenuClick={() => setSidebarOpen(true)}
            isMenuOpen={sidebarOpen}
          />

          <main className="relative flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute -right-28 -top-28 h-72 w-72 rounded-full bg-emerald-100/45 blur-3xl"
            />
            <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-blue-100/45 blur-3xl" />
            <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-violet-100/35 blur-3xl" />
            <div className="relative">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}

export default StudentLayout
