import { Outlet } from 'react-router-dom'
import AdminNavbar from '../components/layout/AdminNavbar'
import AdminSidebar from '../components/layout/AdminSidebar'

const AdminLayout = () => (
  <div className="workspace-ambient min-h-screen lg:flex">
    <AdminSidebar />
    <div className="flex min-w-0 flex-1 flex-col">
      <AdminNavbar />
      <main className="relative flex-1 overflow-hidden p-4 sm:p-6 lg:p-8">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl"
        />
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 top-1/3 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-1/4 h-64 w-64 rounded-full bg-violet-100/30 blur-3xl" />
        <div className="relative">
          <Outlet />
        </div>
      </main>
    </div>
  </div>
)

export default AdminLayout
