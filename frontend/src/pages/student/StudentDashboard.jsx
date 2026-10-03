import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import {
  CalendarDays,
  Utensils,
  CreditCard,
  Clock,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  ArrowRight,
} from 'lucide-react'

import { formatDate, getLocalDateString } from '../../utils/dateUtils'
import { useAuth } from '../../context/AuthContext'
import { getMeals } from '../../services/mealService'
import { getMySubscriptions } from '../../services/subscriptionService'
import { getMyBookings } from '../../services/bookingService'
import CalendarSection from '../../components/CalendarSection'

const StatCard = ({ title, value, description, icon: Icon }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-gray-900">
            {value}
          </p>

          <p className="mt-1 text-xs text-gray-500">
            {description}
          </p>
        </div>

        <div className="rounded-xl bg-emerald-50 p-3 text-emerald-600">
          <Icon size={21} />
        </div>
      </div>
    </div>
  )
}

const StudentServicePanel = ({ services, shouldReduceMotion }) => {
  const [selectedServiceType, setSelectedServiceType] = useState(
    services.find((service) => service.scheduled)?.type || services[0]?.type
  )
  const selectedService = services.find((service) => service.type === selectedServiceType) || services[0]

  if (!selectedService) return null

  return (
    <section aria-labelledby="today-service-heading">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="today-service-heading" className="font-semibold text-white">Today&apos;s service</h2>
          <p className="mt-1 text-xs text-slate-400">Choose a meal to see its current plan.</p>
        </div>
        <p className="text-sm font-semibold tabular-nums text-slate-300">{services.filter((service) => service.scheduled).length}/3 live</p>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-2" role="tablist" aria-label="Today's meal services">
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
              <span className="flex items-center gap-1.5 text-xs font-semibold">
                {service.scheduled ? <CheckCircle2 size={14} className="text-emerald-300" /> : <Circle size={14} className="text-slate-500" />}
                <span className="truncate">{service.label}</span>
              </span>
              <span className="mt-2 block text-[11px] leading-4 text-slate-400">{service.scheduled ? 'Scheduled' : 'Not listed'}</span>
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
          {selectedService.scheduled ? (
            <>
              <p className="text-sm font-semibold text-white">{selectedService.meal.menu}</p>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
                <span>₹{selectedService.meal.price}</span>
                <span>{selectedService.bookingStatus ? `Your booking is ${selectedService.bookingStatus}` : 'No individual booking'}</span>
              </div>
              <Link to="/student/meals" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                View meal details <ArrowRight size={16} />
              </Link>
            </>
          ) : (
            <>
              <p className="text-sm font-semibold text-white">No {selectedService.label.toLowerCase()} has been published for today.</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">Use the calendar to check the next available service date.</p>
              <a href="#meal-calendar" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-emerald-300 transition hover:text-emerald-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                Open meal calendar <ArrowRight size={16} />
              </a>
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </section>
  )
}

const StudentDashboard = () => {
  const { user } = useAuth()
  const shouldReduceMotion = useReducedMotion()

  const [meals, setMeals] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [bookings, setBookings] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refreshBookings = async () => {
    const response = await getMyBookings()

    if (response.success) {
      setBookings(response.bookings || [])
    }
  }

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true)
        setError('')

        const [
          mealsResponse,
          subscriptionsResponse,
          bookingsResponse,
        ] = await Promise.all([
          getMeals(),
          getMySubscriptions(),
          getMyBookings(),
        ])

        if (mealsResponse.success) {
          setMeals(mealsResponse.meals)
        }

        if (subscriptionsResponse.success) {
          setSubscriptions(
            subscriptionsResponse.subscriptions
          )
        }

        if (bookingsResponse.success) setBookings(bookingsResponse.bookings || [])
      } catch (err) {
        console.error('Dashboard loading error:', err)

        setError(
          err.response?.data?.message ||
            'Failed to load dashboard data'
        )
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  useEffect(() => {
    const handleSubscriptionUpdate = (event) => {
            const updatedSubscription = event.detail

            if (!updatedSubscription) return

            setSubscriptions((currentSubscriptions) =>
            currentSubscriptions.map((subscription) =>
                subscription.subscription_id ===
                updatedSubscription.subscription_id
                ? {
                    ...subscription,
                    start_date: updatedSubscription.start_date,
                    end_date: updatedSubscription.end_date,
                    status: updatedSubscription.status,
                    }
                : subscription
            )
            )
        }

        window.addEventListener(
            'subscriptionUpdated',
            handleSubscriptionUpdate
        )

        return () => {
            window.removeEventListener(
            'subscriptionUpdated',
            handleSubscriptionUpdate
            )
    }
   }, [])

  const today = getLocalDateString()
  const activeSubscription = subscriptions.find(
    (subscription) =>
      subscription.status === 'active' &&
      subscription.start_date <= today &&
      subscription.end_date >= today
  )

  const pendingSubscription = subscriptions.find(
    (subscription) => subscription.status === 'pending'
  )

  const upcomingMeals = meals.filter(
    (meal) =>
      new Date(`${meal.meal_date}T00:00:00`) >=
      new Date(new Date().setHours(0, 0, 0, 0))
  )

  const confirmedBookings = bookings.filter(
    (booking) => booking.booking_status === 'confirmed'
  )

  const upcomingBookings = bookings.filter(
    (booking) =>
      booking.meal_date >= today &&
      ['pending', 'confirmed'].includes(booking.booking_status)
  )
  const todayMeals = meals.filter((meal) => meal.meal_date === today)
  const todayServices = ['breakfast', 'lunch', 'dinner'].map((mealType) => {
    const meal = todayMeals.find((item) => item.meal_type?.toLowerCase() === mealType)
    const booking = bookings.find(
      (item) =>
        item.meal_date === today &&
        item.meal_type?.toLowerCase() === mealType &&
        ['pending', 'confirmed'].includes(item.booking_status)
    )

    return {
      type: mealType,
    label: mealType[0].toUpperCase() + mealType.slice(1),
      scheduled: Boolean(meal),
      meal,
      bookingStatus: booking?.booking_status,
    }
  })
  const nextAction = pendingSubscription
    ? {
        title: 'Payment verification is in progress',
        description: 'Your subscription will become active after the admin verifies its payment reference.',
        label: 'View subscription',
        to: '/student/subscription',
      }
    : !activeSubscription
      ? {
          title: 'Choose a mess plan',
          description: 'Start a subscription to cover the scheduled meal types during your plan period.',
          label: 'Browse plans',
          to: '/student/subscription',
        }
      : {
          title: upcomingMeals.length ? 'Review your next meal' : 'Check the service calendar',
          description: upcomingMeals.length
            ? `${upcomingMeals.length} upcoming meal${upcomingMeals.length === 1 ? '' : 's'} are currently scheduled.`
            : 'No upcoming meals are currently scheduled. Check the calendar again later.',
          label: 'Open meal calendar',
          to: '#meal-calendar',
        }

  if (loading) {
    return (
      <div className="space-y-6" role="status" aria-label="Loading student dashboard"><div className="h-36 animate-pulse rounded-2xl bg-slate-200/70" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[0, 1, 2, 3].map((item) => <div key={item} className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />)}</div><div className="h-80 animate-pulse rounded-2xl bg-slate-200/70" /></div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        <p className="font-semibold">
          Unable to load dashboard
        </p>

        <p className="mt-1 text-sm">
          {error}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <motion.header
        initial={shouldReduceMotion ? false : { opacity: 0.72, clipPath: 'inset(0 0 16% 0 round 16px)' }}
        animate={{ opacity: 1, clipPath: 'inset(0 0 0% 0 round 16px)' }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-2xl bg-slate-950 px-6 py-7 text-white shadow-[0_14px_35px_-22px_rgba(15,23,42,0.9)] sm:px-8"
      >
        <div aria-hidden="true" className="absolute -left-20 -top-24 h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-20 right-1/4 h-40 w-40 rounded-full bg-slate-700/50 blur-3xl" />
        <div className="relative grid items-center gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              activeSubscription
                ? 'bg-emerald-400/15 text-emerald-200'
                : pendingSubscription
                  ? 'bg-amber-400/15 text-amber-200'
                  : 'bg-slate-700 text-slate-200'
            }`}>
              {activeSubscription ? 'Subscription active' : pendingSubscription ? 'Verification pending' : 'No active plan'}
            </span>
            <h1 className="mt-5 max-w-xl text-3xl font-bold tracking-[-0.025em] text-white sm:text-4xl">
              Welcome back, {user?.name?.split(' ')[0]}.
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
              See today&apos;s service, your booking state, and the next useful action without searching across pages.
            </p>

            <div className="mt-7 border-t border-slate-800 pt-5">
              <p className="font-semibold text-white">{nextAction.title}</p>
              <p className="mt-1 max-w-lg text-sm text-slate-400">{nextAction.description}</p>
              {nextAction.to.startsWith('#') ? (
                <a href={nextAction.to} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                  {nextAction.label} <ArrowRight size={17} />
                </a>
              ) : (
                <Link to={nextAction.to} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400">
                  {nextAction.label} <ArrowRight size={17} />
                </Link>
              )}
            </div>
          </div>

          <div className="border-t border-slate-800 pt-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <StudentServicePanel services={todayServices} shouldReduceMotion={shouldReduceMotion} />
          </div>
        </div>
      </motion.header>

      {/* Stats */}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Subscription"
          value={
            activeSubscription
              ? 'Active'
              : pendingSubscription
                ? 'Pending'
                : 'None'
          }
          description={
            activeSubscription
              ? `Until ${formatDate(activeSubscription.end_date)}`
              : pendingSubscription
                ? 'Awaiting verification'
                : 'No active plan'
          }
          icon={CalendarDays}
        />

        <StatCard
          title="Upcoming Meals"
          value={upcomingMeals.length}
          description="Meals currently available"
          icon={Utensils}
        />

        <StatCard
          title="Confirmed Bookings"
          value={confirmedBookings.length}
          description="Your confirmed meals"
          icon={Clock}
        />

        <StatCard
          title="Payments"
          value={bookings.length}
          description="Booking payment records"
          icon={CreditCard}
        />
      </div>

      {/* Calendar */}

      <CalendarSection
        activeSubscription={activeSubscription}
        bookings={bookings}
        onBookingsUpdated={async () => {
          try {
            await refreshBookings()
          } catch (err) {
            console.error('Booking refresh error:', err)
            setError(
              err.response?.data?.message || 'Failed to refresh booking status'
            )
          }
        }}
      />

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-950">My Upcoming Bookings</h2>
            <p className="mt-1 text-sm text-slate-500">
              Individual meals awaiting verification or already confirmed.
            </p>
          </div>
          <Link
            to="/student/bookings"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
          >
            View all <ArrowUpRight size={16} />
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
            No upcoming individual meal bookings.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {upcomingBookings.slice(0, 3).map((booking) => (
              <div key={booking.booking_id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {booking.meal_type}
                    </p>
                    <p className="mt-1 font-semibold text-slate-900">{booking.menu}</p>
                  </div>
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    booking.booking_status === 'confirmed'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {booking.booking_status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-500">{formatDate(booking.meal_date)}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upcoming Meals */}

      <section>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              Upcoming Meals
            </h2>

            <p className="text-sm text-slate-600">
              Meals currently scheduled by the mess.
            </p>
          </div>
        </div>

        {upcomingMeals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
            <Utensils className="mx-auto text-gray-400" size={28} />

            <p className="mt-3 font-medium text-gray-700">
              No upcoming meals
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Check back later for the meal schedule.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {upcomingMeals.slice(0, 6).map((meal) => (
              <div
                key={meal.meal_id}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                      {meal.meal_type}
                    </p>

                    <h3 className="mt-1 font-semibold capitalize text-gray-900">
                      {meal.menu}
                    </h3>
                  </div>

                  <span className="rounded-lg bg-gray-100 px-2.5 py-1 text-sm font-semibold text-gray-700">
                    ₹{meal.price}
                  </span>
                </div>

                <div className="mt-4 border-t border-gray-100 pt-3">
                  <p className="text-sm text-gray-500">
                    {formatDate(meal.meal_date)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Subscription */}

      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-950">
          Current Subscription
        </h2>

        {activeSubscription ? (
          <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-gray-500">
                Plan
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {activeSubscription.plan_name}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Price
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                ₹{activeSubscription.price}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                Start Date
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(activeSubscription.start_date)}
              </p>
            </div>

            <div>
              <p className="text-xs text-gray-500">
                End Date
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {formatDate(activeSubscription.end_date)}
              </p>
            </div>
          </div>
        ) : pendingSubscription ? (
          <div className="mt-4 rounded-xl bg-amber-50 p-4">
            <p className="font-semibold text-amber-800">
              Subscription payment pending
            </p>

            <p className="mt-1 text-sm text-amber-700">
              Your subscription is waiting for admin
              payment verification.
            </p>
          </div>
        ) : (
          <div className="mt-4 rounded-xl bg-gray-50 p-4">
            <p className="font-semibold text-gray-700">
              No active subscription
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Choose a mess plan to get started.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

export default StudentDashboard
