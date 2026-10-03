import { useEffect, useMemo, useState } from 'react'
import { BrainCircuit, LoaderCircle, MessageSquareText, Search, Sparkles, Star } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { formatDate } from '../../utils/dateUtils'
import { generateFeedbackInsights, getAllFeedback } from '../../services/feedbackService'

const toInputDate = (date) => date.toISOString().slice(0, 10)

const getInsightDefaultRange = () => {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)

  return { start: toInputDate(start), end: toInputDate(end) }
}

const AdminFeedback = () => {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [ratingFilter, setRatingFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [insightRange] = useState(getInsightDefaultRange)
  const [insightStartDate, setInsightStartDate] = useState(insightRange.start)
  const [insightEndDate, setInsightEndDate] = useState(insightRange.end)
  const [insightMealType, setInsightMealType] = useState('')
  const [insight, setInsight] = useState(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [insightError, setInsightError] = useState('')
  const shouldReduceMotion = useReducedMotion()

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await getAllFeedback()
        if (response.success) {
          const loadedFeedback = response.feedback || []
          setFeedback(loadedFeedback)

          const feedbackDates = loadedFeedback.map((item) => item.meal_date).filter(Boolean).sort()
          if (feedbackDates.length) {
            setInsightStartDate(feedbackDates[0])
            setInsightEndDate(feedbackDates[feedbackDates.length - 1])
          }
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Unable to load meal feedback')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const averageRating = feedback.length
    ? feedback.reduce((total, item) => total + Number(item.rating), 0) / feedback.length
    : 0
  const visibleFeedback = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return feedback.filter((item) => {
      const matchesRating = ratingFilter === 'all' || Number(item.rating) === Number(ratingFilter)
      const matchesSearch = !normalizedSearch
        || item.student_name.toLowerCase().includes(normalizedSearch)
        || item.student_email.toLowerCase().includes(normalizedSearch)
        || item.menu.toLowerCase().includes(normalizedSearch)
        || item.meal_type.toLowerCase().includes(normalizedSearch)
        || item.message?.toLowerCase().includes(normalizedSearch)

      return matchesRating && matchesSearch
    })
  }, [feedback, ratingFilter, search])
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: feedback.filter((item) => Number(item.rating) === rating).length,
  }))

  const handleGenerateInsight = async () => {
    try {
      setInsightLoading(true)
      setInsightError('')
      const response = await generateFeedbackInsights({
        start_date: insightStartDate,
        end_date: insightEndDate,
        meal_type: insightMealType,
      })

      if (response.success) setInsight(response)
    } catch (err) {
      setInsightError(err.response?.data?.message || 'Unable to generate feedback insights right now.')
    } finally {
      setInsightLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">Meal feedback</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-600">Review verified customer feedback for meals they were eligible to consume.</p>
      </header>

      {error && <div className="rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800" role="alert">{error}</div>}

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" aria-labelledby="feedback-insights-heading">
        <div className="border-b border-slate-200 bg-slate-950 px-5 py-5 text-white sm:px-6">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <BrainCircuit size={20} />
              </div>
              <h2 id="feedback-insights-heading" className="mt-4 text-xl font-bold tracking-[-0.02em]">Feedback intelligence</h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-300">Generate an evidence-bound summary from rating statistics and anonymized written feedback. Analysis runs only when you request it.</p>
            </div>
            <button
              type="button"
              onClick={handleGenerateInsight}
              disabled={insightLoading || !insightStartDate || !insightEndDate}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {insightLoading ? <LoaderCircle className="animate-spin" size={17} /> : <Sparkles size={17} />}
              {insightLoading ? 'Generating analysis…' : 'Generate insights'}
            </button>
          </div>
        </div>

        <div className="grid gap-4 p-5 sm:grid-cols-3 sm:p-6">
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block">From</span>
            <input type="date" value={insightStartDate} max={insightEndDate} onChange={(event) => setInsightStartDate(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block">To</span>
            <input type="date" value={insightEndDate} min={insightStartDate} onChange={(event) => setInsightEndDate(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </label>
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block">Meal type</span>
            <select value={insightMealType} onChange={(event) => setInsightMealType(event.target.value)} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
              <option value="">All meal types</option>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
            </select>
          </label>
        </div>

        {insightError && <p className="mx-5 mb-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-800 sm:mx-6 sm:mb-6" role="alert">{insightError}</p>}

        <AnimatePresence initial={false}>
          {insight && (
            <motion.div initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -6 }} transition={{ duration: shouldReduceMotion ? 0 : 0.26, ease: 'easeOut' }} className="border-t border-slate-200 bg-slate-50 p-5 sm:p-6">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-950">{insight.analysis.executive_summary}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{insight.analysis.trend}</p>
                </div>
                <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">{insight.analysis.sentiment}</span>
              </div>

              <div className="mt-5 grid gap-4 lg:grid-cols-3">
                <InsightList title="Recurring signals" items={insight.analysis.themes.map((theme) => `${theme.label} · ${theme.prevalence}: ${theme.summary}`)} />
                <InsightList title="By meal type" items={insight.analysis.meal_type_insights.map((item) => `${item.meal_type}: ${item.summary}`)} />
                <InsightList title="Suggested next actions" items={insight.analysis.recommendations} />
              </div>
              <p className="mt-5 border-t border-slate-200 pt-4 text-xs leading-5 text-slate-500">{insight.cached ? 'Showing a recently generated analysis for this exact scope.' : 'Generated just now and cached for this exact scope for six hours.'} {insight.analysis.limitations}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      <section className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-xl bg-amber-50 p-4 text-amber-900">
          <p className="text-sm font-semibold">Submitted feedback</p>
          <p className="mt-2 text-3xl font-bold tabular-nums">{feedback.length ? averageRating.toFixed(1) : '—'} <span className="text-base font-semibold">/ 5</span></p>
          <p className="mt-1 text-xs text-amber-800">Average from {feedback.length} eligible customer response{feedback.length === 1 ? '' : 's'}.</p>
        </div>
        <div>
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold text-slate-900">Rating distribution</h2><span className="text-xs text-slate-500">Select a row to filter</span></div>
          <div className="mt-3 space-y-2">
            {ratingDistribution.map(({ rating, count }) => {
              const width = feedback.length ? (count / feedback.length) * 100 : 0
              const isSelected = ratingFilter === String(rating)
              return <button key={rating} type="button" onClick={() => setRatingFilter(isSelected ? 'all' : String(rating))} className={`flex w-full items-center gap-3 rounded-lg px-2 py-1 text-left transition ${isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'}`} aria-pressed={isSelected}>
                <span className="w-8 text-xs font-semibold text-slate-700">{rating} star</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-slate-100"><motion.span initial={{ scaleX: 0 }} animate={{ scaleX: width / 100 }} transition={{ duration: shouldReduceMotion ? 0 : 0.38, ease: [0.16, 1, 0.3, 1] }} className="block h-full origin-left bg-emerald-600" /></span>
                <span className="w-6 text-right text-xs font-semibold tabular-nums text-slate-700">{count}</span>
              </button>
            })}
          </div>
        </div>
      </section>

      <section className="surface-wash-violet flex flex-col gap-4 rounded-2xl border border-slate-200 p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-medium text-slate-700">
            <span className="mb-1.5 block">Rating</span>
            <select value={ratingFilter} onChange={(event) => setRatingFilter(event.target.value)} className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
              <option value="all">All ratings</option>
              {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? '' : 's'}</option>)}
            </select>
          </label>
        </div>
        <label className="flex w-full items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-slate-500 transition focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 lg:max-w-xs">
          <span className="sr-only">Search feedback</span>
          <Search size={17} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search feedback" className="min-w-0 flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-500" />
        </label>
      </section>

      {loading ? (
        <div className="space-y-3" role="status" aria-label="Loading meal feedback"><div className="h-14 animate-pulse rounded-xl bg-slate-200/70" /><div className="h-14 animate-pulse rounded-xl bg-slate-200/70" /><div className="h-14 animate-pulse rounded-xl bg-slate-200/70" /></div>
      ) : visibleFeedback.length === 0 ? (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <MessageSquareText className="mx-auto text-slate-400" size={28} />
          <h2 className="mt-3 font-semibold text-slate-900">No feedback matches this view</h2>
          <p className="mt-1 text-sm text-slate-600">Try a different rating or search term.</p>
        </section>
      ) : (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Feedback responses">
          <AnimatePresence mode="popLayout" initial={false}>
            {visibleFeedback.map((item) => (
              <motion.article
                layout
                key={item.feedback_id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2, ease: 'easeOut' }}
                className="flex min-h-56 flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate font-semibold text-slate-950">{item.student_name}</h2>
                    <p className="mt-1 truncate text-xs text-slate-500">{item.student_email}</p>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800"><Star size={13} fill="currentColor" />{item.rating}/5</span>
                </div>
                <div className="mt-5 rounded-xl bg-slate-50 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">{item.meal_type}</p>
                  <p className="mt-1 font-semibold text-slate-900">{item.menu}</p>
                  <p className="mt-1 text-xs text-slate-500">{formatDate(item.meal_date)}</p>
                </div>
                <p className="mt-5 text-sm leading-6 text-slate-700">{item.message || 'No written comment provided.'}</p>
              </motion.article>
            ))}
          </AnimatePresence>
        </section>
      )}
    </div>
  )
}

const InsightList = ({ title, items }) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
    {items.length === 0 ? (
      <p className="mt-3 text-sm text-slate-500">No clear signal was found for this scope.</p>
    ) : (
      <ul className="mt-3 space-y-2.5 text-sm leading-5 text-slate-700">
        {items.map((item, index) => <li key={`${title}-${index}`} className="flex gap-2"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600" />{item}</li>)}
      </ul>
    )}
  </div>
)

export default AdminFeedback
