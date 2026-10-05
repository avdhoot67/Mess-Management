import { motion, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { ArrowLeft, CalendarDays, CreditCard, Mail, MessageSquareText, Phone, ReceiptText, Star, UserRound } from 'lucide-react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { getCustomer } from '../../services/customerService'
import { formatDate } from '../../utils/dateUtils'

const tabs = [
  { value: 'subscriptions', label: 'Subscriptions' },
  { value: 'bookings', label: 'Bookings' },
  { value: 'payments', label: 'Payments' },
  { value: 'feedback', label: 'Feedback' },
]

const statusStyles = {
  active: 'bg-emerald-50 text-emerald-800',
  completed: 'bg-emerald-50 text-emerald-800',
  confirmed: 'bg-emerald-50 text-emerald-800',
  pending: 'bg-amber-50 text-amber-800',
  cancelled: 'bg-rose-50 text-rose-800',
  failed: 'bg-rose-50 text-rose-800',
  expired: 'bg-slate-100 text-slate-700',
}

const historyTabStyles = {
  selected: 'bg-emerald-600 text-white',
  default: 'text-slate-600 hover:bg-slate-100 hover:text-slate-950',
}

const AdminCustomerDetail = () => {
  const { id } = useParams()
  const location = useLocation()
  const [record, setRecord] = useState(null)
  const [activeTab, setActiveTab] = useState('subscriptions')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [reloadKey, setReloadKey] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  const backTarget = `/admin/customers${location.state?.directorySearch || ''}`

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        setRecord(await getCustomer(id))
      } catch (requestError) {
        setError(requestError.response?.data?.message || 'Unable to load this customer')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, reloadKey])

  if (loading) return <CustomerProfileSkeleton />

  if (error || !record) {
    return (
      <div className="space-y-6">
        <Link to={backTarget} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 hover:text-slate-950"><ArrowLeft size={17} /> Back to customers</Link>
        <section className="rounded-2xl border border-rose-100 bg-rose-50 p-6"><h1 className="text-xl font-bold text-rose-950">Customer profile unavailable</h1><p className="mt-2 text-sm text-rose-800">{error}</p><button type="button" onClick={() => setReloadKey((value) => value + 1)} className="mt-4 rounded-lg bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700">Try again</button></section>
      </div>
    )
  }

  const { customer, summary, subscriptions, bookings, payments, feedback } = record
  const currentSubscription = summary.current_subscription

  return (
    <div className="space-y-6">
      <header className="border-b border-slate-200 pb-5">
        <Link to={backTarget} className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"><ArrowLeft size={17} /> Back to customers</Link>
        <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><h1 className="text-2xl font-bold tracking-[-0.02em] text-slate-950 sm:text-3xl">{customer.name}</h1><p className="mt-2 text-sm text-slate-600">Customer since {formatDate(customer.joined_at.slice(0, 10))}</p></div>
          <span className="self-start rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 sm:self-auto">Student account</span>
        </div>
      </header>

      <section className="grid overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric index={0} label="Current plan" value={currentSubscription?.plan_name || 'None'} detail={currentSubscription ? `${currentSubscription.remaining_days} days remaining` : 'No active coverage'} />
        <SummaryMetric index={1} label="Upcoming bookings" value={summary.upcoming_booking_count} detail={`${summary.total_booking_count} total bookings`} />
        <SummaryMetric index={2} label="Verified payments" value={`₹${Number(summary.completed_payment_total).toFixed(2)}`} detail="Completed total" />
        <SummaryMetric index={3} label="Feedback" value={summary.average_rating === null ? '—' : `${summary.average_rating} / 5`} detail={`${summary.feedback_count} responses`} />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.75fr)_minmax(0,1.25fr)]">
        <section className="surface-wash-warm rounded-2xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-800"><UserRound size={20} /></div>
            <h2 className="font-semibold text-slate-950">Contact record</h2>
          </div>
          <dl className="mt-5 space-y-4 text-sm">
            <ContactRow icon={Mail} label="Email" value={customer.email} />
            <ContactRow icon={Phone} label="Phone" value={customer.phone || 'Not linked'} />
            <ContactRow icon={CalendarDays} label="Joined" value={formatDate(customer.joined_at.slice(0, 10))} />
          </dl>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold text-slate-950">Current subscription</h2><p className="mt-1 text-sm text-slate-600">Coverage that is active today.</p></div><CalendarDays className="text-emerald-700" size={22} /></div>
          {currentSubscription ? (
            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <DataPoint label="Plan" value={currentSubscription.plan_name} />
              <DataPoint label="Coverage" value={`${formatDate(currentSubscription.start_date)} – ${formatDate(currentSubscription.end_date)}`} />
              <DataPoint label="Remaining" value={`${currentSubscription.remaining_days} days`} />
              <DataPoint label="Skipped" value={`${currentSubscription.skipped_days} days`} />
            </div>
          ) : (
            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-600">This customer does not have subscription coverage active today.</div>
          )}
        </section>
      </div>

      <section>
        <div className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-3" aria-label="Customer history view">
          {tabs.map((tab) => (
            <button key={tab.value} type="button" aria-pressed={activeTab === tab.value} onClick={() => setActiveTab(tab.value)} className={`shrink-0 rounded-lg px-3 py-2 text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 ${historyTabStyles[activeTab === tab.value ? 'selected' : 'default']}`}>{tab.label} <span className="ml-1 tabular-nums">{record[tab.value].length}</span></button>
          ))}
        </div>
        <motion.div key={activeTab} aria-live="polite" initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: shouldReduceMotion ? 0 : 0.16 }} className="pt-4">
          <HistoryPanel type={activeTab} items={{ subscriptions, bookings, payments, feedback }[activeTab]} />
        </motion.div>
      </section>
    </div>
  )
}

const metricBorders = [
  'border-b sm:border-r xl:border-b-0',
  'border-b xl:border-b-0 xl:border-r',
  'border-b sm:border-b-0 sm:border-r',
  '',
]

const SummaryMetric = ({ index, label, value, detail }) => <div className={`border-slate-800 p-5 ${metricBorders[index]}`}><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p><p className="mt-2 text-xl font-bold tabular-nums text-white">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></div>

const ContactRow = ({ icon: Icon, label, value }) => <div className="flex items-start gap-3"><Icon className="mt-0.5 shrink-0 text-slate-500" size={17} /><div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 break-all font-medium text-slate-900">{value}</dd></div></div>

const DataPoint = ({ label, value }) => <div><dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-sm font-semibold text-slate-950">{value}</dd></div>

const Status = ({ value }) => <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyles[value] || 'bg-slate-100 text-slate-700'}`}>{value}</span>

const HistoryPanel = ({ type, items }) => {
  if (!items.length) return <EmptyHistory type={type} />
  if (type === 'subscriptions') return <SubscriptionsHistory items={items} />
  if (type === 'bookings') return <BookingsHistory items={items} />
  if (type === 'payments') return <PaymentsHistory items={items} />
  return <FeedbackHistory items={items} />
}

const SubscriptionsHistory = ({ items }) => (
  <HistoryTable headers={['Plan', 'Coverage', 'Skips', 'Price', 'Status']}>
    {items.map((item) => <tr key={item.subscription_id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3"><p className="font-semibold text-slate-950">{item.plan_name}</p><p className="text-xs text-slate-500">{item.duration_days} days</p></td><td className="px-4 py-3 text-slate-700">{formatDate(item.start_date)} – {formatDate(item.end_date)}</td><td className="px-4 py-3 tabular-nums text-slate-700">{item.skipped_days}</td><td className="px-4 py-3 font-semibold tabular-nums text-slate-900">₹{Number(item.price).toFixed(2)}</td><td className="px-4 py-3"><Status value={item.is_current ? 'active' : item.status} /></td></tr>)}
  </HistoryTable>
)

const BookingsHistory = ({ items }) => (
  <HistoryTable headers={['Meal', 'Date', 'Menu', 'Payment', 'Booking']}>
    {items.map((item) => <tr key={item.booking_id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3 font-semibold capitalize text-slate-950">{item.meal_type}</td><td className="px-4 py-3 text-slate-700">{formatDate(item.meal_date)}</td><td className="max-w-sm px-4 py-3 text-slate-600">{item.menu}</td><td className="px-4 py-3">{item.payment_status ? <Status value={item.payment_status} /> : <span className="text-xs text-slate-500">No record</span>}</td><td className="px-4 py-3"><Status value={item.status} /></td></tr>)}
  </HistoryTable>
)

const PaymentsHistory = ({ items }) => (
  <HistoryTable headers={['Payment', 'Type', 'Reference', 'Date', 'Status']}>
    {items.map((item) => <tr key={item.payment_id} className="border-b border-slate-100 last:border-0"><td className="px-4 py-3 font-semibold tabular-nums text-slate-950">₹{Number(item.amount).toFixed(2)}</td><td className="px-4 py-3 capitalize text-slate-700">{item.payment_type}</td><td className="px-4 py-3 font-mono text-xs text-slate-600">{item.transaction_reference || 'Not provided'}</td><td className="px-4 py-3 text-slate-600">{formatDate(item.payment_date.slice(0, 10))}</td><td className="px-4 py-3"><Status value={item.payment_status} /></td></tr>)}
  </HistoryTable>
)

const FeedbackHistory = ({ items }) => (
  <div className="grid gap-3 lg:grid-cols-2">
    {items.map((item) => <article key={item.feedback_id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center justify-between gap-3"><p className="font-semibold capitalize text-slate-950">{item.meal_type} · {formatDate(item.meal_date)}</p><span className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700"><Star size={15} fill="currentColor" /> {item.rating}/5</span></div><p className="mt-2 text-xs text-slate-500">{item.menu}</p><p className="mt-4 text-sm leading-6 text-slate-700">{item.message || 'Rating submitted without a written comment.'}</p></article>)}
  </div>
)

const HistoryTable = ({ headers, children }) => <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr>{headers.map((header) => <th key={header} className="px-4 py-3">{header}</th>)}</tr></thead><tbody>{children}</tbody></table></div>

const EmptyHistory = ({ type }) => {
  const icons = { subscriptions: CalendarDays, bookings: ReceiptText, payments: CreditCard, feedback: MessageSquareText }
  const Icon = icons[type]
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><Icon className="mx-auto text-slate-400" size={26} /><p className="mt-3 font-semibold text-slate-950">No {type} recorded</p><p className="mt-1 text-sm text-slate-600">Activity will appear here when the customer uses this part of MessMate.</p></div>
}

const CustomerProfileSkeleton = () => <div className="space-y-6" role="status" aria-label="Loading customer profile"><span className="sr-only">Loading customer profile</span><div className="h-24 animate-pulse rounded-2xl bg-white" /><div className="h-32 animate-pulse rounded-2xl bg-slate-200" /><div className="grid gap-6 lg:grid-cols-2"><div className="h-56 animate-pulse rounded-2xl bg-white" /><div className="h-56 animate-pulse rounded-2xl bg-white" /></div></div>

export default AdminCustomerDetail

