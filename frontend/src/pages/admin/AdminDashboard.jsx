import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, animate, motion, useReducedMotion } from 'motion/react'
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  CircleDollarSign,
  ClipboardCheck,
  Clock3,
  MessageSquareText,
  Utensils,
} from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'
import { getAllBookings } from '../../services/bookingService'
import { getAllFeedback } from '../../services/feedbackService'
import { getMeals } from '../../services/mealService'
import { getAllPayments } from '../../services/paymentService'
import { getAllSubscriptions } from '../../services/subscriptionService'

const getTodayString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getNextSevenDays = () => {
  const days = []

  for (let offset = 0; offset < 7; offset += 1) {
    const date = new Date()
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + offset)

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    days.push({
      date: `${year}-${month}-${day}`,
      label: offset === 0 ? 'Today' : date.toLocaleDateString('en-IN', { weekday: 'short' }),
    })
  }

  return days
}

const AdminServicePanel = ({ services, shouldReduceMotion }) => {
  const [selectedServiceType, setSelectedServiceType] = useState(
    services.find((service) => service.meal)?.type || services[0]?.type
  )
  const selectedService = services.find((service) => service.type === selectedServiceType) || services[0]

  if (!selectedService) return null

  return (
    <section aria-labelledby="service-control-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="service-control-heading" className="font-semibold text-white">Service control</h2>
          <p className="mt-1 text-xs text-slate-400">Choose a meal type to inspect today&apos;s workload.</p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-slate-300">{services.filter((service) => service.meal).length}/3 scheduled</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2" role="tablist" aria-label="Today's meal service controls">
        {services.map((service) => {
          const isSelected = service.type === selectedService.type

          return (
            <button
              key={service.type}
              type="button"
              role="tab"
              aria-selected={isSelected}
              onClick={() => setSelectedServiceType(service.type)}
              className={`rounded-xl border px-2.5 py-3 text-left transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 ${
                isSelected
                  ? 'border-emerald-400/50 bg-emerald-400/10 text-white'
                  : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
              }`}
            >
              <span className="block truncate text-xs font-semibold">{service.label}</span>
              <span className="mt-2 block text-[11px] leading-4 text-slate-400">{service.confirmed} confirmed</span>
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={selectedService.type}
          role="tabpanel"
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -5 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
          className="mt-3 border-t border-slate-800 pt-4"
        >
          {selectedService.meal ? (
            <p className="text-sm font-semibold text-white">{selectedService.meal.menu}</p>
          ) : (
            <p className="text-sm font-semibold text-white">No {selectedService.label.toLowerCase()} is scheduled today.</p>
          )}
          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-400">
            <span>{selectedService.confirmed} confirmed individual booking{selectedService.confirmed === 1 ? '' : 's'}</span>
            <span>{selectedService.pending} pending</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
            <Link to="/admin/bookings" className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
              Review bookings <ArrowRight size={16} />
            </Link>
            <Link to="/admin/meals" className="text-sm font-semibold text-slate-300 transition hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
              Manage schedule
            </Link>
          </div>
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

const AdminDashboard = () => {
  const [bookings, setBookings] = useState([])
  const [feedback, setFeedback] = useState([])
  const [meals, setMeals] = useState([])
  const [payments, setPayments] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedDemandDate, setSelectedDemandDate] = useState(getTodayString())
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const [
          paymentsResponse,
          subscriptionsResponse,
          bookingsResponse,
          mealsResponse,
          feedbackResponse,
        ] = await Promise.all([
          getAllPayments(),
          getAllSubscriptions(),
          getAllBookings(),
          getMeals(),
          getAllFeedback(),
        ])

        if (paymentsResponse.success) setPayments(paymentsResponse.payments || [])
        if (subscriptionsResponse.success) setSubscriptions(subscriptionsResponse.subscriptions || [])
        if (bookingsResponse.success) setBookings(bookingsResponse.bookings || [])
        if (mealsResponse.success) setMeals(mealsResponse.meals || [])
        if (feedbackResponse.success) setFeedback(feedbackResponse.feedback || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load the admin overview')
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [refreshKey])

  const today = getTodayString()
  const pendingPayments = payments.filter((payment) => payment.payment_status === 'pending')
  const completedPayments = payments.filter((payment) => payment.payment_status === 'completed')
  const activeSubscriptions = subscriptions.filter(
    (subscription) => subscription.status === 'active' && subscription.start_date <= today && subscription.end_date >= today
  )
  const todayMeals = meals.filter((meal) => meal.meal_date === today)
  const confirmedUpcomingBookings = bookings.filter(
    (booking) => booking.booking_status === 'confirmed' && booking.meal_date >= today
  )
  const totalCollected = completedPayments.reduce(
    (total, payment) => total + Number(payment.amount),
    0
  )
  const averageRating = feedback.length
    ? feedback.reduce((total, item) => total + Number(item.rating), 0) / feedback.length
    : 0
  const paymentMix = completedPayments.reduce(
    (totals, payment) => ({
      ...totals,
      [payment.payment_type]: totals[payment.payment_type] + Number(payment.amount),
    }),
    { subscription: 0, booking: 0 }
  )
  const demandForecast = getNextSevenDays().map((day) => ({
    ...day,
    bookings: bookings.filter(
      (booking) => booking.meal_date === day.date && booking.booking_status === 'confirmed'
    ).length,
  }))
  const highestDemand = Math.max(...demandForecast.map((day) => day.bookings), 1)
  const selectedDemandDay = demandForecast.find((day) => day.date === selectedDemandDate) || demandForecast[0]
  const selectedDateMeals = meals.filter((meal) => meal.meal_date === selectedDemandDay.date)
  const selectedDatePendingBookings = bookings.filter(
    (booking) => booking.meal_date === selectedDemandDay.date && booking.booking_status === 'pending'
  )
  const todayServices = ['breakfast', 'lunch', 'dinner'].map((mealType) => ({
    type: mealType,
    label: mealType[0].toUpperCase() + mealType.slice(1),
    meal: todayMeals.find((meal) => meal.meal_type?.toLowerCase() === mealType),
    confirmed: bookings.filter(
      (booking) =>
        booking.meal_date === today &&
        booking.meal_type?.toLowerCase() === mealType &&
        booking.booking_status === 'confirmed'
    ).length,
    pending: bookings.filter(
      (booking) =>
        booking.meal_date === today &&
        booking.meal_type?.toLowerCase() === mealType &&
        booking.booking_status === 'pending'
    ).length,
  }))

  if (loading) {
    return (
      <div className="flex min-h-[55vh] items-center justify-center" role="status" aria-label="Loading admin dashboard">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-rose-100 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-slate-950">Admin Dashboard</h1>
        <p className="mt-3 text-sm text-rose-800">{error}</p>
        <button
          type="button"
          onClick={() => setRefreshKey((currentKey) => currentKey + 1)}
          className="mt-5 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">Admin Dashboard</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Monitor today&apos;s service and resolve the work that keeps customers moving.
          </p>
        </div>
        <Link
          to="/admin/payments"
          className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          Review payments <ArrowRight size={17} />
        </Link>
      </header>

      <section className="grid gap-4 lg:grid-cols-12">
        <motion.div
          initial={shouldReduceMotion ? false : { opacity: 0.7, clipPath: 'inset(0 0 18% 0 round 16px)' }}
          animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0 round 16px)' }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden rounded-2xl bg-slate-950 p-5 text-white shadow-[0_14px_35px_-22px_rgba(15,23,42,0.9)] sm:p-6 lg:col-span-7"
        >
          <div aria-hidden="true" className="absolute -right-20 -top-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-20 left-1/4 h-40 w-40 rounded-full bg-slate-700/40 blur-3xl" />
          <div className="relative grid items-center gap-4 sm:grid-cols-[0.8fr_1.2fr]">
            <div>
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                <Utensils size={21} />
              </div>
              <h2 className="mt-6 max-w-xs text-2xl font-bold tracking-[-0.025em] text-white sm:text-3xl">
                Today&apos;s service, under control.
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-slate-300">
                <span className="font-semibold tabular-nums text-white">{todayMeals.length}</span> scheduled meal{todayMeals.length === 1 ? '' : 's'} for {formatDate(today)}. Inspect each service before moving into bookings or the meal schedule.
              </p>
              <p className="mt-5 border-t border-slate-800 pt-4 text-xs leading-5 text-slate-400">
                Every count is derived from today&apos;s individual booking records; subscription-covered meals remain outside those counts.
              </p>
            </div>
            <AdminServicePanel services={todayServices} shouldReduceMotion={shouldReduceMotion} />
          </div>
        </motion.div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 lg:col-span-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Payment approvals need attention</h2>
              <p className="mt-1 text-sm text-slate-600">
                {pendingPayments.length === 0
                  ? 'The verification queue is clear.'
                  : `${pendingPayments.length} payment${pendingPayments.length === 1 ? '' : 's'} await a decision.`}
              </p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
              <Clock3 size={21} />
            </div>
          </div>

          {pendingPayments.length === 0 ? (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              <CheckCircle2 size={18} />
              All submitted payments have been processed.
            </div>
          ) : (
            <div className="mt-6 space-y-2">
              {pendingPayments.slice(0, 3).map((payment) => (
                <div key={payment.payment_id} className="flex flex-col gap-2 rounded-xl bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-slate-900">{payment.student_name}</p>
                    <p className="text-sm text-slate-500">
                      {payment.payment_type === 'subscription' ? 'Subscription' : 'Individual meal'} · {payment.transaction_reference || 'Reference not provided'}
                    </p>
                  </div>
                  <p className="font-semibold tabular-nums text-slate-900">₹{Number(payment.amount).toFixed(2)}</p>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4 text-sm text-slate-600">
            <span>Future individual bookings</span>
            <span className="font-bold tabular-nums text-slate-950">{confirmedUpcomingBookings.length}</span>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricPanel label="Active subscriptions" value={activeSubscriptions.length} detail="Customers currently covered" icon={CalendarDays} tone="emerald" formatValue={(value) => Math.round(value).toString()} shouldReduceMotion={shouldReduceMotion} />
        <MetricPanel label="Completed collections" value={totalCollected} detail={`${completedPayments.length} verified payment${completedPayments.length === 1 ? '' : 's'}`} icon={CircleDollarSign} tone="slate" formatValue={(value) => `₹${value.toFixed(2)}`} shouldReduceMotion={shouldReduceMotion} />
        <MetricPanel label="Meal feedback" value={averageRating} detail={feedback.length ? `${feedback.length} submitted response${feedback.length === 1 ? '' : 's'}` : 'No ratings'} icon={MessageSquareText} tone="amber" formatValue={(value) => feedback.length ? `${value.toFixed(1)} / 5` : 'No ratings'} shouldReduceMotion={shouldReduceMotion} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-950">Confirmed booking demand</h2>
              <p className="mt-1 text-sm text-slate-600">Confirmed individual meal bookings for the next seven days.</p>
            </div>
            <ClipboardCheck className="shrink-0 text-emerald-700" size={21} />
          </div>

          <BookingTrendChart data={demandForecast} highestDemand={highestDemand} selectedDate={selectedDemandDay.date} onSelectDate={setSelectedDemandDate} shouldReduceMotion={shouldReduceMotion} />
          <div className="mt-5 rounded-xl bg-slate-50 p-4" aria-live="polite">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
              <div>
                <p className="text-sm font-semibold text-slate-900">Service detail — {formatDate(selectedDemandDay.date)}</p>
                <p className="mt-1 text-xs text-slate-600">Select a point in the chart to inspect scheduled meals and individual booking activity.</p>
              </div>
              <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{selectedDemandDay.bookings} confirmed</span>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <p className="text-sm text-slate-700"><span className="font-semibold tabular-nums text-slate-950">{selectedDateMeals.length}</span> scheduled meal{selectedDateMeals.length === 1 ? '' : 's'}</p>
              <p className="text-sm text-slate-700"><span className="font-semibold tabular-nums text-slate-950">{selectedDatePendingBookings.length}</span> individual payment{selectedDatePendingBookings.length === 1 ? '' : 's'} pending</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-lg font-bold text-slate-950">Completed payment mix</h2>
          <p className="mt-1 text-sm text-slate-600">Collected amount grouped by the supported payment record type.</p>

          <PaymentMixChart subscriptionAmount={paymentMix.subscription} bookingAmount={paymentMix.booking} total={totalCollected} shouldReduceMotion={shouldReduceMotion} />

          <Link to="/admin/payments" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
            Open payment verification <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-lg font-bold text-slate-950">Recent meal feedback</h2>
            <p className="mt-1 text-sm text-slate-600">Latest customer responses recorded by the system.</p>
          </div>
          <span className="text-sm font-medium text-slate-500">{feedback.length} total response{feedback.length === 1 ? '' : 's'}</span>
        </div>

        {feedback.length === 0 ? (
          <p className="mt-6 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">No feedback has been submitted yet.</p>
        ) : (
          <div className="mt-6 grid gap-3 lg:grid-cols-3">
            {feedback.slice(0, 3).map((item) => (
              <article key={item.feedback_id} className="rounded-xl bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.student_name}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatDate(item.meal_date)} · {item.meal_type}</p>
                  </div>
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">{item.rating}/5</span>
                </div>
                <p className="mt-3 text-sm text-slate-700">{item.message || 'No written comment provided.'}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

const MetricPanel = ({ label, value, detail, icon: Icon, tone, formatValue, shouldReduceMotion }) => {
  const iconClasses = {
    emerald: 'bg-emerald-50 text-emerald-700',
    slate: 'bg-slate-100 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-2xl font-bold tabular-nums text-slate-950"><AnimatedMetric value={value} formatValue={formatValue} shouldReduceMotion={shouldReduceMotion} /></p>
          <p className="mt-1 text-xs text-slate-500">{detail}</p>
        </div>
        <div className={`rounded-xl p-3 ${iconClasses[tone]}`}><Icon size={20} /></div>
      </div>
    </div>
  )
}

const AnimatedMetric = ({ value, formatValue, shouldReduceMotion }) => {
  const [displayValue, setDisplayValue] = useState(value)

  useEffect(() => {
    if (shouldReduceMotion) return undefined

    const controls = animate(0, value, {
      duration: 0.55,
      ease: 'easeOut',
      onUpdate: setDisplayValue,
    })

    return () => controls.stop()
  }, [value, shouldReduceMotion])

  return formatValue(shouldReduceMotion ? value : displayValue)
}

const BookingTrendChart = ({ data, highestDemand, selectedDate, onSelectDate, shouldReduceMotion }) => {
  const width = 620
  const height = 230
  const padding = { top: 24, right: 24, bottom: 42, left: 34 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const points = data.map((day, index) => {
    const x = padding.left + (chartWidth / (data.length - 1 || 1)) * index
    const y = padding.top + chartHeight - (day.bookings / highestDemand) * chartHeight
    return { ...day, x, y }
  })
  const linePoints = points.map((point) => `${point.x},${point.y}`).join(' ')

  return (
    <div className="mt-6">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Confirmed individual meal bookings for the next seven days">
        {[0, 0.5, 1].map((marker) => {
          const y = padding.top + chartHeight - marker * chartHeight
          return <line key={marker} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 5" />
        })}
        <motion.polyline points={linePoints} fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" initial={shouldReduceMotion ? false : { pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }} />
        {points.map((point) => (
          <g key={point.date} role="button" tabIndex="0" aria-label={`${formatDate(point.date)}, ${point.bookings} confirmed individual bookings`} aria-pressed={point.date === selectedDate} className="cursor-pointer focus:outline-none" onClick={() => onSelectDate(point.date)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onSelectDate(point.date) } }}>
            <motion.circle cx={point.x} cy={point.y} r={point.date === selectedDate ? "7" : "5"} fill={point.date === selectedDate ? "#d1fae5" : "#ffffff"} stroke="#059669" strokeWidth="3" initial={shouldReduceMotion ? false : { scale: 0 }} animate={{ scale: 1 }} transition={{ delay: shouldReduceMotion ? 0 : 0.25 + (point.x / width) * 0.2, duration: shouldReduceMotion ? 0 : 0.2 }} />
            <text x={point.x} y={height - 16} textAnchor="middle" fill="#64748b" fontSize="12">{point.label}</text>
            <text x={point.x} y={point.y - 12} textAnchor="middle" fill="#334155" fontSize="12" fontWeight="600">{point.bookings}</text>
          </g>
        ))}
      </svg>
      <p className="mt-2 text-xs text-slate-500">Counts include confirmed individual bookings only; subscription-covered meals are not counted as individual bookings.</p>
    </div>
  )
}

const PaymentMixChart = ({ subscriptionAmount, bookingAmount, total, shouldReduceMotion }) => {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const subscriptionPercentage = total ? subscriptionAmount / total : 0
  const subscriptionLength = circumference * subscriptionPercentage
  const bookingLength = circumference - subscriptionLength

  return (
    <div className="mt-6 grid items-center gap-6 sm:grid-cols-[auto_1fr]">
      <div className="relative mx-auto h-36 w-36">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" role="img" aria-label="Completed collection split between subscriptions and individual meals">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#f1f5f9" strokeWidth="16" />
          <motion.circle cx="70" cy="70" r={radius} fill="none" stroke="#059669" strokeWidth="16" strokeLinecap="round" initial={shouldReduceMotion ? false : { strokeDasharray: `0 ${circumference}` }} animate={{ strokeDasharray: `${subscriptionLength} ${circumference}` }} transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut' }} />
          {bookingLength > 0 && <motion.circle cx="70" cy="70" r={radius} fill="none" stroke="#334155" strokeWidth="16" strokeLinecap="round" strokeDashoffset={-subscriptionLength} initial={shouldReduceMotion ? false : { strokeDasharray: `0 ${circumference}` }} animate={{ strokeDasharray: `${bookingLength} ${circumference}` }} transition={{ duration: shouldReduceMotion ? 0 : 0.6, ease: 'easeOut', delay: shouldReduceMotion ? 0 : 0.18 }} />}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-slate-500">Collected</span>
          <span className="text-sm font-bold tabular-nums text-slate-950">₹{total.toFixed(0)}</span>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <PaymentLegend label="Subscriptions" amount={subscriptionAmount} colorClass="bg-emerald-600" total={total} />
        <PaymentLegend label="Individual meals" amount={bookingAmount} colorClass="bg-slate-700" total={total} />
      </div>
    </div>
  )
}

const PaymentLegend = ({ label, amount, colorClass, total }) => {
  const percentage = total ? Math.round((amount / total) * 100) : 0

  return (
    <div className="flex items-center justify-between gap-4">
      <span className="flex items-center gap-2 text-slate-700"><span className={`h-2.5 w-2.5 rounded-full ${colorClass}`} />{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">₹{amount.toFixed(2)} <span className="font-normal text-slate-500">({percentage}%)</span></span>
    </div>
  )
}

export default AdminDashboard
