import { useEffect, useState } from 'react'
import { CalendarDays, History, Utensils } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { formatDate } from '../../utils/dateUtils'
import { getMeals } from '../../services/mealService'
import { getMyBookings } from '../../services/bookingService'
import { getMySubscriptions } from '../../services/subscriptionService'
import { getMyDaySkips } from '../../services/daySkipService'
import BookingModal from '../../components/BookingModal'

const getTodayString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getYesterdayString = () => {
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const year = yesterday.getFullYear()
  const month = String(yesterday.getMonth() + 1).padStart(2, '0')
  const day = String(yesterday.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const StudentMeals = () => {
  const today = getTodayString()
  const yesterday = getYesterdayString()
  const [date, setDate] = useState('')
  const [view, setView] = useState('upcoming')
  const [meals, setMeals] = useState([])
  const [bookings, setBookings] = useState([])
  const [activeSubscription, setActiveSubscription] = useState(null)
  const [skips, setSkips] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedMeal, setSelectedMeal] = useState(null)
  const shouldReduceMotion = useReducedMotion()

  const loadData = async () => {
    const [mealsResponse, bookingsResponse, subscriptionsResponse, skipsResponse] =
      await Promise.all([
        getMeals(),
        getMyBookings(),
        getMySubscriptions(),
        getMyDaySkips(),
      ])

    if (mealsResponse.success) setMeals(mealsResponse.meals || [])
    if (bookingsResponse.success) setBookings(bookingsResponse.bookings || [])
    if (skipsResponse.success) setSkips(skipsResponse.skips || [])

    const active = (subscriptionsResponse.subscriptions || []).find(
      (subscription) => subscription.status === 'active'
    )
    setActiveSubscription(active || null)
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        await loadData()
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load meals')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const isCovered = (mealDate) => {
    if (!activeSubscription) return false

    const skipped = skips.some(
      (skip) =>
        skip.subscription_id === activeSubscription.subscription_id &&
        skip.skip_date === mealDate
    )

    return (
      !skipped &&
      mealDate >= activeSubscription.start_date &&
      mealDate <= activeSubscription.end_date
    )
  }

  const getBooking = (mealId) =>
    bookings.find((booking) => booking.meal_id === mealId)

  const visibleMeals = meals.filter((meal) => {
    const matchesSelectedDate = !date || meal.meal_date === date
    const isPast = meal.meal_date < today

    return matchesSelectedDate && (view === 'history' ? isPast : !isPast)
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-950">Meals</h1>
          <p className="mt-2 text-sm text-slate-600">
            Browse the mess menu and book individual meals.
          </p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="relative flex rounded-xl border border-slate-200 bg-white p-1" role="tablist" aria-label="Meal range">
            <button
              type="button"
              onClick={() => {
                setView('upcoming')
                setDate('')
              }}
              role="tab"
              aria-selected={view === 'upcoming'}
              className={`relative z-10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${view === 'upcoming' ? 'text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {view === 'upcoming' && <motion.span layoutId="meal-range-indicator" transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }} className="absolute inset-0 -z-10 rounded-lg bg-emerald-600" />}
              <CalendarDays size={16} /> Today onward
            </button>
            <button
              type="button"
              onClick={() => {
                setView('history')
                setDate('')
              }}
              role="tab"
              aria-selected={view === 'history'}
              className={`relative z-10 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${view === 'history' ? 'text-white' : 'text-slate-600 hover:bg-slate-50'}`}
            >
              {view === 'history' && <motion.span layoutId="meal-range-indicator" transition={shouldReduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }} className="absolute inset-0 -z-10 rounded-lg bg-slate-700" />}
              <History size={16} /> Meal history
            </button>
          </div>

          <div>
          <label htmlFor="meal-date" className="mb-1 block text-xs text-gray-500">
            Select a date
          </label>
          <input
            id="meal-date"
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            min={view === 'upcoming' ? today : undefined}
            max={view === 'history' ? yesterday : undefined}
            onClick={(event) => event.currentTarget.showPicker?.()}
            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-500"
          />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading meals">{[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />)}</div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
          {error}
        </div>
      ) : visibleMeals.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <Utensils className="mx-auto text-gray-400" size={28} />
          <p className="mt-3 font-medium text-gray-700">
            {view === 'history' ? 'No previous meals found' : 'No upcoming meals found'}
          </p>
        </div>
      ) : (
        <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={`${view}-${date || 'all'}`}
          initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
          transition={{ duration: shouldReduceMotion ? 0 : 0.18, ease: 'easeOut' }}
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-3"
        >
          {visibleMeals.map((meal) => {
            const booking = getBooking(meal.meal_id)

            return (
              <div
                key={meal.meal_id}
                className="surface-wash-cool rounded-2xl border border-slate-200 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                  {meal.meal_type}
                </p>
                <h2 className="mt-1 font-semibold text-slate-900">{meal.menu}</h2>
                <p className="mt-2 text-sm text-slate-500">
                  {formatDate(meal.meal_date)} · ₹{meal.price}
                </p>

                <div className="mt-4">
                  {view === 'history' ? null : booking?.booking_status === 'confirmed' ? (
                    <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800">
                      Already booked
                    </p>
                  ) : booking?.booking_status === 'pending' ? (
                    <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
                      Payment verification pending
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setSelectedMeal(meal)}
                      className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      {booking?.booking_status === 'cancelled'
                        ? 'Rebook'
                        : isCovered(meal.meal_date)
                          ? 'Book extra meal'
                          : 'Book meal'}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </motion.div>
        </AnimatePresence>
      )}

      {selectedMeal && (
        <BookingModal
          meal={selectedMeal}
          isCoveredBySubscription={
            getBooking(selectedMeal.meal_id)?.booking_status !== 'cancelled' &&
            isCovered(selectedMeal.meal_date)
          }
          onClose={() => setSelectedMeal(null)}
          onSuccess={async () => {
            setSelectedMeal(null)
            await loadData()
          }}
        />
      )}
    </div>
  )
}

export default StudentMeals
