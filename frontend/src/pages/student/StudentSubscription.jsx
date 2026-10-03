import { useEffect, useState } from 'react'
import { CheckCircle2, Clock3, ShieldCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { formatDate, getLocalDateString } from '../../utils/dateUtils'
import { getPlans } from '../../services/planService'
import {
  createSubscription,
  getMySubscriptions,
} from '../../services/subscriptionService'
import { getMyDaySkips } from '../../services/daySkipService'

const getDateDistance = (from, to) => {
  const start = new Date(`${from}T00:00:00`)
  const end = new Date(`${to}T00:00:00`)
  return Math.round((end - start) / 86400000)
}

const StudentSubscription = () => {
  const [plans, setPlans] = useState([])
  const [subscriptions, setSubscriptions] = useState([])
  const [skips, setSkips] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [transactionReference, setTransactionReference] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const shouldReduceMotion = useReducedMotion()

  const load = async () => {
    const [plansResponse, subscriptionsResponse, skipsResponse] = await Promise.all([
      getPlans(),
      getMySubscriptions(),
      getMyDaySkips(),
    ])

    if (plansResponse.success) setPlans(plansResponse.plans || [])
    if (subscriptionsResponse.success) {
      setSubscriptions(subscriptionsResponse.subscriptions || [])
    }
    if (skipsResponse.success) setSkips(skipsResponse.skips || [])
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError('')
        await load()
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load subscription data'
        )
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const today = getLocalDateString()
  const activeSubscription = subscriptions.find(
    (subscription) => subscription.status === 'active' && subscription.start_date <= today && subscription.end_date >= today
  )
  const expiredSubscription = subscriptions.find(
    (subscription) => subscription.status === 'active' && subscription.end_date < today
  )
  const pendingSubscription = subscriptions.find(
    (subscription) => subscription.status === 'pending'
  )
  const subscriptionSkips = activeSubscription
    ? skips.filter((skip) => skip.subscription_id === activeSubscription.subscription_id).length
    : 0
  const totalPlanDays = activeSubscription
    ? Math.max(getDateDistance(activeSubscription.start_date, activeSubscription.end_date) + 1, 1)
    : 1
  const elapsedPlanDays = activeSubscription
    ? Math.min(Math.max(getDateDistance(activeSubscription.start_date, today) + 1, 0), totalPlanDays)
    : 0
  const daysRemaining = activeSubscription
    ? Math.max(getDateDistance(today, activeSubscription.end_date) + 1, 0)
    : 0
  const planProgress = (elapsedPlanDays / totalPlanDays) * 100

  const handlePurchase = async (event) => {
    event.preventDefault()
    if (!selectedPlan) return

    try {
      setSubmitting(true)
      setError('')
      setSuccess('')

      const response = await createSubscription(
        selectedPlan.plan_id,
        transactionReference.trim()
      )

      if (response.success) {
        setSuccess(
          'Subscription payment submitted for admin verification.'
        )
        setSelectedPlan(null)
        setTransactionReference('')
        await load()
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit subscription'
      )
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading subscription"><div className="h-24 animate-pulse rounded-2xl bg-slate-200/70" /><div className="h-44 animate-pulse rounded-2xl bg-slate-200/70" /></div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Subscription</h1>
        <p className="mt-2 text-sm text-slate-600">
          Choose a plan. The amount is taken from the plan price.
        </p>
      </div>

      <section className="grid gap-4 rounded-2xl border border-emerald-100 bg-emerald-50 p-5 sm:grid-cols-3">
        <div className="flex gap-3">
          <ShieldCheck className="shrink-0 text-emerald-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-emerald-950">All meals covered</p>
            <p className="mt-1 text-xs text-emerald-800">Breakfast, lunch, and dinner for your plan period.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Clock3 className="shrink-0 text-emerald-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-emerald-950">Manual verification</p>
            <p className="mt-1 text-xs text-emerald-800">Your plan becomes active after payment approval.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <CheckCircle2 className="shrink-0 text-emerald-600" size={20} />
          <div>
            <p className="text-sm font-semibold text-emerald-950">No manual amount</p>
            <p className="mt-1 text-xs text-emerald-800">The price is always taken from the selected plan.</p>
          </div>
        </div>
      </section>

      {error && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}
      {success && (
        <div role="status" aria-live="polite" className="rounded-xl bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {activeSubscription ? (
        <div className="surface-wash-cool rounded-2xl border border-emerald-200 p-6 shadow-sm">
          <p className="text-sm font-semibold text-emerald-700">Active plan</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">
            {activeSubscription.plan_name}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {formatDate(activeSubscription.start_date)} →{' '}
            {formatDate(activeSubscription.end_date)}
          </p>
          <div className="mt-6 rounded-xl bg-slate-50 p-4">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-900">Subscription runway</p>
                <p className="mt-1 text-xs text-slate-600">{daysRemaining} day{daysRemaining === 1 ? '' : 's'} remaining, including today.</p>
              </div>
              <p className="text-sm font-semibold tabular-nums text-slate-900">{elapsedPlanDays} / {totalPlanDays} days</p>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200" aria-label={`${elapsedPlanDays} of ${totalPlanDays} subscription days elapsed`} role="progressbar" aria-valuemin="0" aria-valuemax={totalPlanDays} aria-valuenow={elapsedPlanDays}>
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: planProgress / 100 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="h-full origin-left bg-emerald-600"
              />
            </div>
            <p className="mt-3 text-xs text-slate-600">{subscriptionSkips} of 5 subscription skips used. Skipped days extend the end date after server confirmation.</p>
          </div>
        </div>
      ) : pendingSubscription ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="font-semibold text-amber-800">Payment pending</p>
          <p className="mt-1 text-sm text-amber-700">
            {pendingSubscription.plan_name} is waiting for admin verification.
          </p>
        </div>
      ) : null}

      {!activeSubscription && !pendingSubscription && expiredSubscription && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="font-semibold text-slate-900">Your previous plan has ended</p>
          <p className="mt-1 text-sm text-slate-600">
            {expiredSubscription.plan_name} ended on {formatDate(expiredSubscription.end_date)}. Choose a new plan below to submit another payment for verification.
          </p>
        </div>
      )}

      {!activeSubscription && !pendingSubscription && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <button
              type="button"
              key={plan.plan_id}
              onClick={() => setSelectedPlan(plan)}
              className={`rounded-2xl border bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                selectedPlan?.plan_id === plan.plan_id
                  ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-100'
                  : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40'
              }`}
            >
              <h2 className="font-semibold text-gray-900">{plan.plan_name}</h2>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                ₹{plan.price}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {plan.duration_days} days
              </p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-emerald-700">
                Includes all daily meal types
              </p>
              {plan.description && (
                <p className="mt-3 text-sm text-gray-600">{plan.description}</p>
              )}
            </button>
          ))}
        </div>
      )}

      {selectedPlan && !activeSubscription && !pendingSubscription && (
        <form
          onSubmit={handlePurchase}
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
        >
          <h2 className="font-semibold text-gray-900">
            Pay for {selectedPlan.plan_name}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Amount: ₹{selectedPlan.price} (from plan price)
          </p>

          <label
            htmlFor="subscription-reference"
            className="mt-4 mb-2 block text-sm font-medium text-gray-700"
          >
            Transaction reference
          </label>
          <input
            id="subscription-reference"
            value={transactionReference}
            onChange={(event) => setTransactionReference(event.target.value)}
            required
            minLength={6}
            maxLength={100}
            pattern="[A-Za-z0-9][A-Za-z0-9_-]{5,99}"
            title="Use 6 to 100 letters, numbers, hyphens, or underscores"
            className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-4 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit for verification'}
          </button>
        </form>
      )}
    </div>
  )
}

export default StudentSubscription
