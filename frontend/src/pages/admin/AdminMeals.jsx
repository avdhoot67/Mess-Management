import { useEffect, useMemo, useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { Dialog } from '@base-ui/react/dialog'
import { CalendarDays, ChevronLeft, ChevronRight, Plus, X } from 'lucide-react'
import { formatDate } from '../../utils/dateUtils'
import {
  createMeal,
  deleteMeal,
  getMeals,
  updateMeal,
} from '../../services/mealService'

const getTodayString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getWeekDays = (startDate) => {
  const start = new Date(`${startDate}T00:00:00`)

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)

    return {
      date: getDateString(date),
      weekday: date.toLocaleDateString('en-IN', { weekday: 'short' }),
      day: date.getDate(),
    }
  })
}

const shiftDate = (dateString, amount) => {
  const date = new Date(`${dateString}T00:00:00`)
  date.setDate(date.getDate() + amount)
  return getDateString(date)
}

const mealTypes = ['breakfast', 'lunch', 'dinner']
const fieldClassName = 'w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100'

const AdminMeals = () => {
  const [meals, setMeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [weekStart, setWeekStart] = useState(getTodayString())
  const [typeFilter, setTypeFilter] = useState('all')
  const [editingMeal, setEditingMeal] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const shouldReduceMotion = useReducedMotion()

  const loadMeals = async () => {
    const response = await getMeals()
    if (response.success) setMeals(response.meals || [])
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        await loadMeals()
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load scheduled meals')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const today = getTodayString()
  const weekDays = useMemo(() => getWeekDays(weekStart), [weekStart])
  const visibleMealTypes = typeFilter === 'all' ? mealTypes : [typeFilter]
  const mealsInWeek = useMemo(
    () => meals.filter((meal) => weekDays.some((day) => day.date === meal.meal_date)),
    [meals, weekDays]
  )

  const handleSaved = async (message) => {
    try {
      await loadMeals()
      setEditingMeal(null)
      setSuccess(message)
    } catch (err) {
      setError(err.response?.data?.message || 'Meal saved, but the list could not be refreshed')
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return

    try {
      setError('')
      await deleteMeal(deleteTarget.meal_id)
      await loadMeals()
      setSuccess('Meal removed from the schedule.')
      setDeleteTarget(null)
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to remove this meal')
      setDeleteTarget(null)
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">Meal schedule</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Publish, revise, and review the meals available to customers.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditingMeal({ meal_date: today, meal_type: 'breakfast', menu: '', price: '' })}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
        >
          <Plus size={17} /> Add meal
        </button>
      </header>

      {error && (
        <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</div>
      )}
      {success && (
        <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800" role="status">{success}</div>
      )}

      <section className="surface-wash-cool rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="font-semibold text-slate-950">Planning week</p>
            <div className="mt-2 flex items-center gap-2">
              <button type="button" onClick={() => setWeekStart((currentDate) => shiftDate(currentDate, -7))} className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" aria-label="Previous week"><ChevronLeft size={18} /></button>
              <p className="min-w-48 text-sm font-semibold tabular-nums text-slate-800">{formatDate(weekDays[0].date)} – {formatDate(weekDays[6].date)}</p>
              <button type="button" onClick={() => setWeekStart((currentDate) => shiftDate(currentDate, 7))} className="rounded-lg border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600" aria-label="Next week"><ChevronRight size={18} /></button>
              <button type="button" onClick={() => setWeekStart(today)} className="ml-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">This week</button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">
              <span className="mb-1.5 block">Jump to date</span>
              <span className="flex rounded-lg border border-slate-300 bg-white focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100">
                <CalendarDays className="m-2.5 text-slate-500" size={17} />
                <input
                  type="date"
                  value={weekStart}
                  onChange={(event) => setWeekStart(event.target.value)}
                  onClick={(event) => event.currentTarget.showPicker?.()}
                  className="min-w-0 bg-transparent py-2 pr-3 text-sm text-slate-900 outline-none"
                />
              </span>
            </label>

            <label className="text-sm font-medium text-slate-700">
              <span className="mb-1.5 block">Meal type</span>
              <select
                value={typeFilter}
                onChange={(event) => setTypeFilter(event.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              >
                <option value="all">All meal types</option>
                {mealTypes.map((type) => <option key={type} value={type}>{capitalize(type)}</option>)}
              </select>
            </label>
          </div>
        </div>
      </section>

      {loading ? (
        <div className="flex min-h-[35vh] items-center justify-center" role="status" aria-label="Loading meals">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-emerald-600" />
        </div>
      ) : (
        <section className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[112px_repeat(7,minmax(112px,1fr))] border-b border-slate-200 bg-slate-50">
              <div className="px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">Service</div>
              {weekDays.map((day) => (
                <div key={day.date} className={`border-l border-slate-200 px-3 py-3 text-center ${day.date === today ? 'bg-emerald-50/70' : ''}`}>
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{day.date === today ? 'Today' : day.weekday}</p>
                  <p className="mt-1 text-lg font-bold tabular-nums text-slate-900">{day.day}</p>
                </div>
              ))}
            </div>
            {visibleMealTypes.map((mealType) => (
              <div key={mealType} className="grid grid-cols-[112px_repeat(7,minmax(112px,1fr))] border-b border-slate-100 last:border-b-0">
                <div className="flex items-center px-4 py-5"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{mealType}</span></div>
                {weekDays.map((day) => {
                  const meal = mealsInWeek.find((item) => item.meal_date === day.date && item.meal_type === mealType)

                  return (
                    <div key={`${day.date}-${mealType}`} className={`min-h-32 border-l border-slate-100 p-2 ${day.date === today ? 'bg-emerald-50/30' : ''}`}>
                      {meal ? (
                        <motion.button
                          type="button"
                          whileHover={shouldReduceMotion ? undefined : { y: -2 }}
                          onClick={() => setEditingMeal(meal)}
                          className="flex h-full w-full flex-col rounded-xl bg-slate-50 p-3 text-left transition hover:bg-emerald-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                        >
                          <p className="line-clamp-2 text-sm font-semibold leading-5 text-slate-900">{meal.menu}</p>
                          <p className="mt-2 text-xs font-semibold tabular-nums text-emerald-700">₹{Number(meal.price).toFixed(2)}</p>
                          <p className="mt-auto pt-3 text-[11px] text-slate-500">Edit meal</p>
                        </motion.button>
                      ) : (
                        <button type="button" onClick={() => setEditingMeal({ meal_date: day.date, meal_type: mealType, menu: '', price: '' })} className="flex h-full min-h-28 w-full items-center justify-center rounded-xl border border-dashed border-slate-200 px-2 text-xs font-semibold text-slate-500 transition hover:border-emerald-300 hover:text-emerald-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600">
                          <Plus size={15} className="mr-1" /> Add
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </section>
      )}

      {editingMeal && <MealFormDialog meal={editingMeal} onClose={() => setEditingMeal(null)} onSaved={handleSaved} />}
      {deleteTarget && <DeleteMealDialog meal={deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} />}
    </div>
  )
}

const MealFormDialog = ({ meal, onClose, onSaved }) => {
  const isEditing = Boolean(meal.meal_id)
  const [form, setForm] = useState({
    meal_date: meal.meal_date,
    meal_type: meal.meal_type,
    menu: meal.menu,
    price: meal.price,
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()

    try {
      setSubmitting(true)
      setError('')
      const payload = { ...form, price: Number(form.price) }

      if (isEditing) {
        await updateMeal(meal.meal_id, payload)
        await onSaved('Meal schedule updated.')
      } else {
        await createMeal(payload)
        await onSaved('Meal added to the schedule.')
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save this meal')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <DialogFrame title={isEditing ? 'Edit meal' : 'Add meal'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Meal date">
            <input required type="date" value={form.meal_date} onChange={(event) => setForm((current) => ({ ...current, meal_date: event.target.value }))} className={fieldClassName} />
          </Field>
          <Field label="Meal type">
            <select value={form.meal_type} onChange={(event) => setForm((current) => ({ ...current, meal_type: event.target.value }))} className={fieldClassName}>
              {mealTypes.map((type) => <option key={type} value={type}>{capitalize(type)}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Menu">
          <input required value={form.menu} onChange={(event) => setForm((current) => ({ ...current, menu: event.target.value }))} placeholder="e.g. Dal, rice, sabzi" className={fieldClassName} />
        </Field>
        <Field label="Individual meal price (₹)">
          <input required min="0" step="0.01" type="number" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className={fieldClassName} />
        </Field>
        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800" role="alert">{error}</p>}
        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
          <Dialog.Close disabled={submitting} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</Dialog.Close>
          <button type="submit" disabled={submitting} className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? 'Saving...' : isEditing ? 'Save changes' : 'Add meal'}</button>
        </div>
      </form>
    </DialogFrame>
  )
}

const DeleteMealDialog = ({ meal, onClose, onConfirm }) => {
  const [submitting, setSubmitting] = useState(false)

  const handleConfirm = async () => {
    setSubmitting(true)
    await onConfirm()
    setSubmitting(false)
  }

  return <AlertDialog.Root open onOpenChange={(open) => !open && !submitting && onClose()}>
    <AlertDialog.Portal>
      <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45" />
      <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <AlertDialog.Popup className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-xl outline-none">
    <AlertDialog.Title className="text-lg font-bold text-slate-950">Delete meal?</AlertDialog.Title>
    <AlertDialog.Description className="mt-2 text-sm text-slate-600">This removes {meal.meal_type} on {formatDate(meal.meal_date)} from the schedule. Meals with related records cannot be deleted.</AlertDialog.Description>
    <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <AlertDialog.Close disabled={submitting} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">Cancel</AlertDialog.Close>
      <button type="button" onClick={handleConfirm} disabled={submitting} className="rounded-lg bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50">{submitting ? 'Deleting...' : 'Delete meal'}</button>
    </div>
        </AlertDialog.Popup>
      </AlertDialog.Viewport>
    </AlertDialog.Portal>
  </AlertDialog.Root>
}

const DialogFrame = ({ title, children, onClose }) => (
  <Dialog.Root open onOpenChange={(open) => !open && onClose()}>
    <Dialog.Portal>
      <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45" />
      <Dialog.Viewport className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <Dialog.Popup className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-lg overflow-y-auto outline-none">
    <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.18, ease: 'easeOut' }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
      <div className="mb-5 flex items-start justify-between gap-4">
        <Dialog.Title className="text-lg font-bold text-slate-950">{title}</Dialog.Title>
        <Dialog.Close className="rounded-lg p-3 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900" aria-label="Close dialog"><X size={18} /></Dialog.Close>
      </div>
      {children}
    </motion.div>
      </Dialog.Popup>
      </Dialog.Viewport>
    </Dialog.Portal>
  </Dialog.Root>
)

const Field = ({ label, children }) => (
  <label className="block text-sm font-medium text-slate-700">
    <span className="mb-1.5 block">{label}</span>
    {children}
  </label>
)

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1)

export default AdminMeals
