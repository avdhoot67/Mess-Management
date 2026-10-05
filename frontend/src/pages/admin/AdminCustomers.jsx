import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Search, UserRoundSearch } from 'lucide-react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { getCustomers } from '../../services/customerService'
import { formatDate } from '../../utils/dateUtils'

const segments = [
  { value: 'all', label: 'All customers' },
  { value: 'subscribed', label: 'Active subscriptions' },
  { value: 'bookings', label: 'Upcoming bookings' },
  { value: 'both', label: 'Both' },
  { value: 'inactive', label: 'No current service' },
]

const serviceStateStyles = {
  subscribed: 'bg-emerald-50 text-emerald-800',
  bookings: 'bg-blue-50 text-blue-800',
  both: 'bg-violet-50 text-violet-800',
  inactive: 'bg-slate-100 text-slate-700',
}

const serviceStateLabels = {
  subscribed: 'Subscription',
  bookings: 'Bookings',
  both: 'Subscription + bookings',
  inactive: 'No current service',
}

const segmentButtonStyles = {
  selected: 'bg-emerald-600 text-white',
  default: 'bg-white text-slate-700 hover:bg-slate-100',
}

const AdminCustomers = () => {
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const [customers, setCustomers] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1 })
  const [segment, setSegment] = useState(() => segments.some((item) => item.value === searchParams.get('segment')) ? searchParams.get('segment') : 'all')
  const [sort, setSort] = useState(() => ['newest', 'oldest', 'name_asc', 'name_desc', 'recent_activity'].includes(searchParams.get('sort')) ? searchParams.get('sort') : 'newest')
  const [search, setSearch] = useState(() => searchParams.get('search') || '')
  const [page, setPage] = useState(() => Math.max(1, Number(searchParams.get('page')) || 1))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const nextParams = new URLSearchParams()
    if (search.trim()) nextParams.set('search', search.trim())
    if (segment !== 'all') nextParams.set('segment', segment)
    if (sort !== 'newest') nextParams.set('sort', sort)
    if (page > 1) nextParams.set('page', String(page))
    setSearchParams(nextParams, { replace: true })
  }, [page, search, segment, setSearchParams, sort])

  useEffect(() => {
    let active = true
    const timeout = window.setTimeout(async () => {
      try {
        setLoading(true)
        setError('')
        const response = await getCustomers({ search: search.trim(), segment, sort, page, limit: 20 })
        if (active) {
          setCustomers(response.customers || [])
          setPagination(response.pagination || { page: 1, total: 0, total_pages: 1 })
        }
      } catch (requestError) {
        if (active) {
          setCustomers([])
          setError(requestError.response?.data?.message || 'Unable to load customers')
        }
      } finally {
        if (active) setLoading(false)
      }
    }, search ? 280 : 0)

    return () => {
      active = false
      window.clearTimeout(timeout)
    }
  }, [page, reloadKey, search, segment, sort])

  const changeSegment = (nextSegment) => {
    setSegment(nextSegment)
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">Customers</h1>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">Find a student, understand their current service, and open the full operational record behind it.</p>
      </header>

      <section className="surface-wash-cool rounded-2xl border border-slate-200 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 2xl:flex-row 2xl:items-end 2xl:justify-between">
          <div className="min-w-0">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Current relationship</p>
            <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Customer service filter">
              {segments.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={segment === item.value}
                  onClick={() => changeSegment(item.value)}
                  className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${segmentButtonStyles[segment === item.value ? 'selected' : 'default']}`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(16rem,1fr)_12rem] 2xl:w-[35rem]">
            <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-500 transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
              <span className="sr-only">Search customers</span>
              <Search size={17} />
              <input
                value={search}
                onChange={(event) => { setSearch(event.target.value); setPage(1) }}
                placeholder="Search name, email, or phone"
                className="min-w-0 flex-1 bg-transparent text-sm text-slate-950 outline-none placeholder:text-slate-500"
              />
            </label>
            <label>
              <span className="sr-only">Sort customers</span>
              <select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1) }} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
                <option value="newest">Newest joined</option>
                <option value="oldest">Oldest joined</option>
                <option value="name_asc">Name A–Z</option>
                <option value="name_desc">Name Z–A</option>
                <option value="recent_activity">Recent activity</option>
              </select>
            </label>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="flex flex-col gap-3 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:flex-row sm:items-center sm:justify-between">
          <span>{error}</span>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)} className="self-start rounded-lg px-3 py-2 font-semibold hover:bg-rose-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 sm:self-auto">Try again</button>
        </div>
      )}

      {error ? null : loading ? (
        <CustomerSkeleton />
      ) : customers.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <UserRoundSearch className="mx-auto text-slate-400" size={30} />
          <h2 className="mt-3 font-semibold text-slate-950">No customers match this view</h2>
          <p className="mt-1 text-sm text-slate-600">Change the service filter or search term to widen the directory.</p>
        </section>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${segment}-${sort}-${page}-${search}`}
            initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.18 }}
          >
            <p className="mb-3 text-sm text-slate-600"><span className="font-semibold tabular-nums text-slate-950">{pagination.total}</span> {pagination.total === 1 ? 'customer' : 'customers'} in this view</p>
            <CustomerTable customers={customers} directorySearch={location.search} />
            <CustomerCards customers={customers} directorySearch={location.search} />
          </motion.div>
        </AnimatePresence>
      )}

      {!loading && !error && pagination.total > 0 && (
        <nav className="flex items-center justify-between border-t border-slate-200 pt-4" aria-label="Customer pages">
          <p className="text-sm text-slate-600">Page <span className="font-semibold tabular-nums text-slate-900">{pagination.page}</span> of <span className="font-semibold tabular-nums text-slate-900">{pagination.total_pages}</span></p>
          <div className="flex gap-2">
            <PaginationButton disabled={page <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}><ChevronLeft size={17} /> Previous</PaginationButton>
            <PaginationButton disabled={page >= pagination.total_pages} onClick={() => setPage((value) => value + 1)}>Next <ChevronRight size={17} /></PaginationButton>
          </div>
        </nav>
      )}
    </div>
  )
}

const CustomerTable = ({ customers, directorySearch }) => (
  <section className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
    <table className="min-w-full text-left text-sm">
      <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
        <tr><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Current service</th><th className="px-4 py-3">Next milestone</th><th className="px-4 py-3">Feedback</th><th className="px-4 py-3">Joined</th><th className="px-4 py-3 text-right"><span className="sr-only">Open profile</span></th></tr>
      </thead>
      <tbody>
        {customers.map((customer) => (
          <tr key={customer.user_id} className="border-b border-slate-100 last:border-0 hover:bg-emerald-50/35">
            <td className="px-4 py-3"><p className="font-semibold text-slate-950">{customer.name}</p><p className="mt-0.5 text-xs text-slate-500">{customer.email}</p><p className="mt-0.5 text-xs text-slate-500">{customer.phone || 'No phone linked'}</p></td>
            <td className="px-4 py-3"><ServiceState state={customer.service_state} /><p className="mt-2 text-xs text-slate-500">{customer.active_subscription_count} active · {customer.upcoming_booking_count} upcoming</p></td>
            <td className="px-4 py-3 text-slate-700">{customer.subscription_end_date ? <p>Plan ends {formatDate(customer.subscription_end_date)}</p> : customer.next_booking_date ? <p>Meal on {formatDate(customer.next_booking_date)}</p> : <p className="text-slate-500">No upcoming milestone</p>}</td>
            <td className="px-4 py-3"><p className="font-semibold tabular-nums text-slate-900">{customer.average_rating === null ? '—' : `${customer.average_rating} / 5`}</p><p className="text-xs text-slate-500">{customer.feedback_count} responses</p></td>
            <td className="px-4 py-3 text-slate-600">{formatDate(customer.joined_at.slice(0, 10))}</td>
            <td className="px-4 py-3 text-right"><Link to={`/admin/customers/${customer.user_id}`} state={{ directorySearch }} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">View profile <ArrowRight size={15} /></Link></td>
          </tr>
        ))}
      </tbody>
    </table>
  </section>
)

const CustomerCards = ({ customers, directorySearch }) => (
  <div className="space-y-3 md:hidden">
    {customers.map((customer) => (
      <Link key={customer.user_id} to={`/admin/customers/${customer.user_id}`} state={{ directorySearch }} className="block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
        <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold text-slate-950">{customer.name}</p><p className="truncate text-xs text-slate-500">{customer.email}</p></div><ArrowRight className="shrink-0 text-emerald-700" size={18} /></div>
        <div className="mt-4 flex flex-wrap items-center gap-2"><ServiceState state={customer.service_state} /><span className="text-xs text-slate-500">Joined {formatDate(customer.joined_at.slice(0, 10))}</span></div>
        <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-4 border-t border-slate-100 pt-4 text-sm">
          <div><p className="text-xs text-slate-500">Active plans</p><p className="mt-1 font-semibold tabular-nums text-slate-900">{customer.active_subscription_count}</p></div>
          <div><p className="text-xs text-slate-500">Upcoming bookings</p><p className="mt-1 font-semibold tabular-nums text-slate-900">{customer.upcoming_booking_count}</p></div>
          <div><p className="text-xs text-slate-500">Next milestone</p><p className="mt-1 font-semibold text-slate-900">{customer.subscription_end_date ? formatDate(customer.subscription_end_date) : customer.next_booking_date ? formatDate(customer.next_booking_date) : 'None'}</p></div>
          <div><p className="text-xs text-slate-500">Feedback</p><p className="mt-1 font-semibold tabular-nums text-slate-900">{customer.average_rating === null ? '—' : `${customer.average_rating} / 5`}</p></div>
        </div>
      </Link>
    ))}
  </div>
)

const ServiceState = ({ state }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${serviceStateStyles[state] || serviceStateStyles.inactive}`}>{serviceStateLabels[state] || serviceStateLabels.inactive}</span>

const PaginationButton = ({ children, disabled, onClick }) => <button type="button" disabled={disabled} onClick={onClick} className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:cursor-not-allowed disabled:opacity-40">{children}</button>

const CustomerSkeleton = () => <div className="space-y-3" role="status" aria-label="Loading customers"><span className="sr-only">Loading customers</span>{[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl bg-white shadow-sm" />)}</div>

export default AdminCustomers

