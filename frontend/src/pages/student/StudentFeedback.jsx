import { useEffect, useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { formatDate, getLocalDateString } from '../../utils/dateUtils'
import { getMeals } from '../../services/mealService'
import { getMyBookings } from '../../services/bookingService'
import { getMySubscriptions } from '../../services/subscriptionService'
import { getMyDaySkips } from '../../services/daySkipService'
import {
  createFeedback,
  getMyFeedback,
} from '../../services/feedbackService'

const StudentFeedback = () => {
  const [feedback, setFeedback] = useState([])
  const [meals, setMeals] = useState([])
  const [bookings, setBookings] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [skips, setSkips] = useState([])
  const [form, setForm] = useState({
    meal_id: '',
    rating: 5,
    message: '',
  })
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = async () => {
    const [feedbackResponse, mealsResponse, bookingsResponse, subscriptionsResponse, skipsResponse] = await Promise.all([
      getMyFeedback(),
      getMeals(),
      getMyBookings(),
      getMySubscriptions(),
      getMyDaySkips(),
    ])

    if (feedbackResponse.success) setFeedback(feedbackResponse.feedback || [])
    if (mealsResponse.success) setMeals(mealsResponse.meals || [])
    if (bookingsResponse.success) setBookings(bookingsResponse.bookings || [])
    if (subscriptionsResponse.success) setSubscriptions(subscriptionsResponse.subscriptions || [])
    if (skipsResponse.success) setSkips(skipsResponse.skips || [])
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        await load()
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load feedback')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const today = getLocalDateString()
  const reviewedMealIds = new Set(feedback.map((item) => item.meal_id))
  const eligibleMeals = meals.filter((meal) => {
    if (meal.meal_date > today || reviewedMealIds.has(meal.meal_id)) return false

    const hasConfirmedBooking = bookings.some(
      (booking) => booking.meal_id === meal.meal_id && booking.booking_status === 'confirmed'
    )
    const coveringSubscription = subscriptions.find(
      (subscription) =>
        subscription.status === 'active' &&
        subscription.start_date <= meal.meal_date &&
        subscription.end_date >= meal.meal_date
    )
    const wasSkipped = coveringSubscription && skips.some(
      (skip) => skip.subscription_id === coveringSubscription.subscription_id && skip.skip_date === meal.meal_date
    )

    return hasConfirmedBooking || Boolean(coveringSubscription && !wasSkipped)
  })

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const response = await createFeedback({
        meal_id: Number(form.meal_id),
        rating: Number(form.rating),
        message: form.message,
      })

      if (response.success) {
        setSuccess('Feedback submitted.')
        setForm({ meal_id: '', rating: 5, message: '' })
        await load()
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading feedback"><div className="h-56 animate-pulse rounded-2xl bg-slate-200/70" /><div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" /></div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Feedback</h1>
        <p className="mt-2 text-sm text-slate-600">
          Eligibility is checked by the server. You can rate meals you were
          covered for or booked.
        </p>
      </div>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div role="status" aria-live="polite" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="surface-wash-warm rounded-2xl border border-slate-200 p-6 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">Share your experience</h2>
        <p className="mt-1 text-sm text-slate-500">Your feedback helps the mess team improve future menus.</p>

        <label htmlFor="feedback-meal" className="mt-4 mb-2 block text-sm font-medium text-gray-700">
          Meal
        </label>
        <select
          id="feedback-meal"
          required
          value={form.meal_id}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, meal_id: event.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500"
        >
          <option value="">Select a meal</option>
          {eligibleMeals.map((meal) => (
            <option key={meal.meal_id} value={meal.meal_id}>
              {formatDate(meal.meal_date)} · {meal.meal_type} · {meal.menu}
            </option>
          ))}
        </select>
        {eligibleMeals.length === 0 && <p className="mt-2 text-sm text-slate-600">No eligible meals are currently available for feedback.</p>}

        <label htmlFor="feedback-rating" className="mt-4 mb-2 block text-sm font-medium text-gray-700">
          Rating
        </label>
        <select
          id="feedback-rating"
          value={form.rating}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, rating: event.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500"
        >
          {[1, 2, 3, 4, 5].map((rating) => (
            <option key={rating} value={rating}>
              {rating}
            </option>
          ))}
        </select>

        <label htmlFor="feedback-message" className="mt-4 mb-2 block text-sm font-medium text-gray-700">
          Message (optional)
        </label>
        <textarea
          id="feedback-message"
          value={form.message}
          onChange={(event) =>
            setForm((previous) => ({ ...previous, message: event.target.value }))
          }
          rows={3}
          maxLength={1000}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500"
        />

        <button
          type="submit"
          disabled={submitting || eligibleMeals.length === 0}
          className="mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>
      </form>

      {feedback.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <MessageSquare className="mx-auto text-gray-400" size={28} />
          <p className="mt-3 font-medium text-gray-700">No feedback yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {feedback.map((item) => (
            <div
              key={item.feedback_id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition duration-200 hover:border-emerald-200"
            >
              <p className="text-xs uppercase tracking-wide text-emerald-600">
                {item.meal_type} · {formatDate(item.meal_date)}
              </p>
              <p className="mt-1 font-semibold text-gray-900">{item.menu}</p>
              <p className="mt-2 text-sm text-gray-700">Rating: {item.rating}/5</p>
              {item.message && (
                <p className="mt-1 text-sm text-gray-600">{item.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default StudentFeedback
