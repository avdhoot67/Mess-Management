import { useEffect, useMemo, useState } from 'react'
import { CalendarDays, Search, TicketCheck } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'
import { getAllBookings } from '../../services/bookingService'

const bookingStatusClasses = {
  pending: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-rose-50 text-rose-800',
}

const paymentStatusClasses = {
  pending: 'bg-amber-50 text-amber-800',
  completed: 'bg-emerald-50 text-emerald-800',
  failed: 'bg-rose-50 text-rose-800',
}

const AdminBookings = () => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [bookingStatus, setBookingStatus] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await getAllBookings()
        if (response.success) setBookings(response.bookings || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load bookings')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const visibleBookings = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return bookings.filter((booking) => {
      const matchesStatus = bookingStatus === 'all' || booking.booking_status === bookingStatus
      const matchesDate = !dateFilter || booking.meal_date === dateFilter
      const matchesSearch = !normalizedSearch
        || booking.student_name.toLowerCase().includes(normalizedSearch)
        || booking.student_email.toLowerCase().includes(normalizedSearch)
        || booking.menu.toLowerCase().includes(normalizedSearch)
        || booking.meal_type.toLowerCase().includes(normalizedSearch)

      return matchesStatus && matchesDate && matchesSearch
    })
  }, [bookingStatus, bookings, dateFilter, search])

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">Individual meal bookings</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Review customer booking records alongside their latest payment state.</p>
      </header>

      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</div>}

      <section className="surface-wash-cool grid gap-3 rounded-2xl border border-slate-200 p-5 shadow-sm lg:grid-cols-[auto_auto_1fr] lg:items-end">
        <label className="text-sm font-medium text-slate-700">
          <span className="mb-1.5 block">Booking status</span>
          <select value={bookingStatus} onChange={(event) => setBookingStatus(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100 lg:w-44">
            <option value="all">All statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="text-sm font-medium text-slate-700">
          <span className="mb-1.5 block">Meal date</span>
          <span className="flex rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
            <CalendarDays className="m-2.5 text-slate-500" size={17} />
            <input type="date" value={dateFilter} onChange={(event) => setDateFilter(event.target.value)} onClick={(event) => event.currentTarget.showPicker?.()} className="min-w-0 bg-transparent py-2 pr-3 text-sm text-slate-900 outline-none" />
          </span>
        </label>
        <label className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-500 transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
          <span className="sr-only">Search bookings</span>
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student, menu, or meal type" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" />
        </label>
      </section>

      {loading ? (
        <div className="flex min-h-[35vh] items-center justify-center" role="status" aria-label="Loading bookings">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        </div>
      ) : visibleBookings.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <TicketCheck className="mx-auto text-slate-400" size={28} />
          <h2 className="mt-3 font-semibold text-slate-900">No bookings match this view</h2>
          <p className="mt-1 text-sm text-slate-600">Try a different status, date, or search term.</p>
        </section>
      ) : (
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Meal</th>
                <th className="px-4 py-3">Meal date</th>
                <th className="px-4 py-3">Booking</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Reference</th>
              </tr>
            </thead>
            <tbody>
              {visibleBookings.map((booking) => (
                <tr key={booking.booking_id} className="border-b border-slate-50 transition hover:bg-emerald-50/35">
                  <td className="px-4 py-3"><p className="font-semibold text-slate-900">{booking.student_name}</p><p className="text-xs text-slate-500">{booking.student_email}</p></td>
                  <td className="px-4 py-3"><p className="font-semibold capitalize text-slate-900">{booking.meal_type}</p><p className="text-xs text-slate-500">{booking.menu}</p></td>
                  <td className="px-4 py-3 text-slate-700">{formatDate(booking.meal_date)}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${bookingStatusClasses[booking.booking_status] || 'bg-slate-100 text-slate-700'}`}>{booking.booking_status}</span></td>
                  <td className="px-4 py-3">
                    {booking.payment_status ? (
                      <div><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${paymentStatusClasses[booking.payment_status] || 'bg-slate-100 text-slate-700'}`}>{booking.payment_status}</span><p className="mt-1 text-xs font-semibold tabular-nums text-slate-900">₹{Number(booking.payment_amount).toFixed(2)}</p></div>
                    ) : <span className="text-xs text-slate-500">No payment record</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{booking.transaction_reference || 'Not provided'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  )
}

export default AdminBookings
