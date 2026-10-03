import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Search, Users } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'
import { getAllSubscriptions } from '../../services/subscriptionService'
import { getLocalDateString } from '../../utils/dateUtils'

const statusClasses = {
  active: 'bg-emerald-50 text-emerald-800',
  pending: 'bg-amber-50 text-amber-800',
  expired: 'bg-slate-100 text-slate-700',
  cancelled: 'bg-rose-50 text-rose-800',
}
const filterButtonClasses = {
  active: 'bg-emerald-600 text-white',
  inactive: 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900',
}

const AdminSubscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const today = getLocalDateString()
  const effectiveSubscriptions = useMemo(
    () => subscriptions.map((subscription) => ({
      ...subscription,
      effectiveStatus: subscription.status === 'active' && subscription.end_date < today
        ? 'expired'
        : subscription.status,
    })),
    [subscriptions, today]
  )

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await getAllSubscriptions()
        if (response.success) setSubscriptions(response.subscriptions || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load subscriptions')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const counts = effectiveSubscriptions.reduce(
    (currentCounts, subscription) => ({
      ...currentCounts,
      [subscription.effectiveStatus]: (currentCounts[subscription.effectiveStatus] || 0) + 1,
    }),
    { all: effectiveSubscriptions.length }
  )
  const visibleSubscriptions = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return effectiveSubscriptions.filter((subscription) => {
      const matchesStatus = statusFilter === 'all' || subscription.effectiveStatus === statusFilter
      const matchesSearch = !normalizedSearch
        || subscription.student_name.toLowerCase().includes(normalizedSearch)
        || subscription.student_email.toLowerCase().includes(normalizedSearch)
        || subscription.plan_name.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesSearch
    })
  }, [effectiveSubscriptions, search, statusFilter])

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">Subscriptions</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Review customer coverage, plan details, and the subscription state confirmed by the system.</p>
      </header>

      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</div>}

      <section className="surface-wash-cool flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2" aria-label="Subscription status filter">
          {['all', 'active', 'pending', 'expired', 'cancelled'].map((status) => (
            <FilterButton key={status} active={statusFilter === status} onClick={() => setStatusFilter(status)}>
              {capitalize(status)} <span className="ml-1 tabular-nums">{status === 'all' ? subscriptions.length : counts[status] || 0}</span>
            </FilterButton>
          ))}
        </div>
        <label className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-500 transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 lg:max-w-xs">
          <span className="sr-only">Search subscriptions</span>
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student or plan" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" />
        </label>
      </section>

      {loading ? (
        <div className="flex min-h-[35vh] items-center justify-center" role="status" aria-label="Loading subscriptions">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        </div>
      ) : visibleSubscriptions.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Users className="mx-auto text-slate-400" size={28} />
          <h2 className="mt-3 font-semibold text-slate-900">No subscriptions match this view</h2>
          <p className="mt-1 text-sm text-slate-600">Try a different status or search term.</p>
        </section>
      ) : (
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Coverage period</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleSubscriptions.map((subscription) => (
                <tr key={subscription.subscription_id} className="border-b border-slate-50 transition hover:bg-emerald-50/35">
                  <td className="px-4 py-3"><p className="font-semibold text-slate-900">{subscription.student_name}</p><p className="text-xs text-slate-500">{subscription.student_email}</p></td>
                  <td className="px-4 py-3"><p className="font-semibold text-slate-900">{subscription.plan_name}</p><p className="text-xs text-slate-500">{subscription.duration_days} days</p></td>
                  <td className="px-4 py-3 text-slate-700"><div className="flex items-center gap-2"><CalendarDays size={16} className="text-emerald-700" /><span>{formatDate(subscription.start_date)} – {formatDate(subscription.end_date)}</span></div></td>
                  <td className="px-4 py-3 font-semibold tabular-nums text-slate-900">₹{Number(subscription.price).toFixed(2)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[subscription.effectiveStatus] || 'bg-slate-100 text-slate-700'}`}>{subscription.effectiveStatus}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

const FilterButton = ({ active, children, onClick }) => (
  <button type="button" onClick={onClick} aria-pressed={active} className={`rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${filterButtonClasses[active ? 'active' : 'inactive']}`}>
    {children}
  </button>
)

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1)

export default AdminSubscriptions
