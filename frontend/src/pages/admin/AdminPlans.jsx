import { useEffect, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { Dialog } from '@base-ui/react/dialog'
import { Check, Pencil, Plus, ReceiptText, X } from 'lucide-react'
import { createPlan, getPlans, updatePlan } from '../../services/planService'

const fieldClassName = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'

const AdminPlans = () => {
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [editingPlan, setEditingPlan] = useState(null)
  const shouldReduceMotion = useReducedMotion()

  const loadPlans = async () => {
    const response = await getPlans()
    if (response.success) setPlans(response.plans || [])
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        await loadPlans()
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load mess plans')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleSaved = async (message) => {
    try {
      await loadPlans()
      setEditingPlan(null)
      setSuccess(message)
    } catch (err) {
      setError(err.response?.data?.message || 'Plan saved, but the list could not be refreshed')
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">Mess plans</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Set the price and duration for subscriptions that cover all meal types.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditingPlan({ plan_name: '', price: '', duration_days: '', description: '' })}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <Plus size={17} /> Add plan
        </button>
      </header>

      <section className="surface-wash-violet flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 shadow-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="font-semibold text-slate-950">Subscription coverage</h2>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">Every plan covers breakfast, lunch, and dinner for its duration. Do not configure meal-type inclusions here.</p>
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800">
          <Check size={17} /> All meal types
        </div>
      </section>

      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</div>}
      {success && <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{success}</div>}

      {loading ? (
        <div className="flex min-h-[35vh] items-center justify-center" role="status" aria-label="Loading mess plans">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        </div>
      ) : plans.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <ReceiptText className="mx-auto text-slate-400" size={28} />
          <h2 className="mt-3 font-semibold text-slate-900">No plans available</h2>
          <p className="mt-1 text-sm text-slate-600">Add a duration-based plan before students can submit a subscription request.</p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Subscription plan catalogue">
          {plans.map((plan, index) => (
            <motion.article
              key={plan.plan_id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.2), duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
              className="flex min-h-64 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-4">
                <h2 className="font-semibold text-slate-950">{plan.plan_name}</h2>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold tabular-nums text-emerald-800">{plan.duration_days} days</span>
              </div>
              <p className="mt-6 text-3xl font-bold tracking-[-0.025em] tabular-nums text-slate-950">₹{Number(plan.price).toFixed(2)}</p>
              <p className="mt-1 text-xs text-slate-500">Subscription price</p>
              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-sm leading-6 text-slate-600">{plan.description || 'No description provided.'}</p>
              </div>
              <button type="button" onClick={() => setEditingPlan(plan)} className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                <Pencil size={16} /> Edit plan
              </button>
            </motion.article>
          ))}
        </section>
      )}

      {editingPlan && <PlanFormDialog plan={editingPlan} onClose={() => setEditingPlan(null)} onSaved={handleSaved} />}
    </div>
  )
}

const PlanFormDialog = ({ plan, onClose, onSaved }) => {
  const isEditing = Boolean(plan.plan_id)
  const [form, setForm] = useState({
    plan_name: plan.plan_name,
    price: plan.price,
    duration_days: plan.duration_days,
    description: plan.description || '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')
      const payload = {
        ...form,
        price: Number(form.price),
        duration_days: Number(form.duration_days),
      }

      if (isEditing) {
        await updatePlan(plan.plan_id, payload)
        await onSaved('Mess plan updated.')
      } else {
        await createPlan(payload)
        await onSaved('Mess plan added.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this plan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog.Root open onOpenChange={(open) => !open && !submitting && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <Dialog.Popup className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto outline-none">
      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <Dialog.Title className="text-lg font-bold text-slate-950">{isEditing ? 'Edit mess plan' : 'Add mess plan'}</Dialog.Title>
            <p className="mt-1 text-sm text-slate-600">The selected plan will cover all meal types for its configured duration.</p>
          </div>
          <Dialog.Close disabled={submitting} className="rounded-lg p-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50" aria-label="Close dialog"><X size={18} /></Dialog.Close>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Plan name">
            <input required value={form.plan_name} onChange={(event) => setForm((current) => ({ ...current, plan_name: event.target.value }))} placeholder="e.g. Monthly plan" className={fieldClassName} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Subscription price (₹)">
              <input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className={fieldClassName} />
            </Field>
            <Field label="Duration (days)">
              <input required min="1" step="1" type="number" value={form.duration_days} onChange={(event) => setForm((current) => ({ ...current, duration_days: event.target.value }))} className={fieldClassName} />
            </Field>
          </div>
          <Field label="Description (optional)">
            <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} className={fieldClassName} />
          </Field>
          {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p>}
          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
            <Dialog.Close disabled={submitting} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</Dialog.Close>
            <button type="submit" disabled={submitting} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Add plan'}</button>
          </div>
        </form>
      </motion.div>
        </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

const Field = ({ label, children }) => (
  <label className="block text-sm font-medium text-slate-700">
    <span className="mb-1.5 block">{label}</span>
    {children}
  </label>
)

export default AdminPlans
