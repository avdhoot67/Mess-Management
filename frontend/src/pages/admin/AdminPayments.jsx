import { useEffect, useState } from 'react'
import { Check, Clock3, X } from 'lucide-react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { formatDate } from '../../utils/dateUtils'
import {
  approvePayment,
  getAllPayments,
  rejectPayment,
} from '../../services/paymentService'

const statusClasses = {
  pending: 'bg-amber-100 text-amber-800',
  completed: 'bg-emerald-100 text-emerald-800',
  failed: 'bg-rose-100 text-rose-800',
}

const AdminPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionPayment, setActionPayment] = useState(null)
  const [action, setAction] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [actionError, setActionError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const shouldReduceMotion = useReducedMotion()

  const loadPayments = async () => {
    const response = await getAllPayments()
    if (response.success) setPayments(response.payments || [])
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        await loadPayments()
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const submitAction = async () => {
    if (!actionPayment || !action) return

    try {
      setSubmitting(true)
      setActionError('')
      if (action === 'approve') {
        await approvePayment(actionPayment.payment_id)
      } else {
        await rejectPayment(actionPayment.payment_id)
      }
      setActionPayment(null)
      setAction(null)
      await loadPayments()
    } catch (err) {
      setActionError(err.response?.data?.message || `Failed to ${action} payment`)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="space-y-6" role="status" aria-label="Loading payment verification"><div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" /><div className="h-80 animate-pulse rounded-2xl border border-slate-200 bg-white" /></div>
  }

  const pendingPayments = payments.filter((payment) => payment.payment_status === 'pending')
  const visiblePayments = payments.filter((payment) => {
    const query = search.trim().toLowerCase()
    const matchesSearch = !query || [payment.student_name, payment.student_email, payment.transaction_reference]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(query))
    const matchesStatus = statusFilter === 'all' || payment.payment_status === statusFilter
    const matchesType = typeFilter === 'all' || payment.payment_type === typeFilter
    return matchesSearch && matchesStatus && matchesType
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Payment Verification</h1>
        <p className="mt-2 text-sm text-slate-600">Approve or reject submitted payment references. Pending actions update the related booking or subscription.</p>
      </div>

      {error && <div className="rounded-xl bg-rose-50 p-4 text-sm text-rose-800">{error}</div>}

      <section className="surface-wash-cool rounded-2xl border border-slate-200 p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-wrap gap-2" aria-label="Payment queue filters">
            {[
              ['all', `All (${payments.length})`],
              ['pending', `Pending (${pendingPayments.length})`],
              ['completed', 'Completed'],
              ['failed', 'Failed'],
            ].map(([value, label]) => (
              <button key={value} type="button" onClick={() => setStatusFilter(value)} aria-pressed={statusFilter === value} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${statusFilter === value ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}>
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="Filter payment type" className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100">
              <option value="all">All payment types</option>
              <option value="subscription">Subscriptions</option>
              <option value="booking">Individual meals</option>
            </select>
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search student or reference" aria-label="Search payments" className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" />
          </div>
        </div>
      </section>

      {payments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">No payment records found.</div>
      ) : visiblePayments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center"><p className="font-semibold text-slate-900">No matching payment records</p><p className="mt-1 text-sm text-slate-500">Adjust the filters or search term to review another payment.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Student</th>
                <th className="px-4 py-3">Type / record</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
              {visiblePayments.map((payment) => (
                <motion.tr key={payment.payment_id} layout initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: shouldReduceMotion ? 0 : 0.16 }} className="border-b border-slate-50 transition hover:bg-emerald-50/35">
                  <td className="px-4 py-3"><p className="font-semibold text-slate-900">{payment.student_name}</p><p className="text-xs text-slate-500">{payment.student_email}</p></td>
                  <td className="px-4 py-3"><p className="capitalize text-slate-700">{payment.payment_type}</p><p className="text-xs text-slate-500">{payment.subscription_id ? `Subscription #${payment.subscription_id}` : `Booking #${payment.booking_id}`}</p></td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600"><p>{payment.transaction_reference || 'Not provided'}</p>{Boolean(payment.has_duplicate_reference) && <p className="mt-1 font-sans text-[11px] font-semibold text-amber-700">Duplicate reference</p>}</td>
                  <td className="px-4 py-3 font-semibold text-slate-900">₹{payment.amount}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDate(payment.payment_date?.slice(0, 10))}</td>
                  <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusClasses[payment.payment_status] || 'bg-slate-100 text-slate-700'}`}>{payment.payment_status}</span></td>
                  <td className="px-4 py-3">
                    {payment.payment_status === 'pending' ? (
                      <div className="flex gap-2">
                        <button type="button" onClick={() => { setActionError(''); setActionPayment(payment); setAction('approve') }} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700"><Check size={15} />Approve</button>
                        <button type="button" onClick={() => { setActionError(''); setActionPayment(payment); setAction('reject') }} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-2.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50"><X size={15} />Reject</button>
                      </div>
                    ) : <span className="text-xs text-slate-400">Processed</span>}
                  </td>
                </motion.tr>
              ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}

      {actionPayment && (
        <AlertDialog.Root open={Boolean(actionPayment)} onOpenChange={(open) => { if (!open && !submitting) { setActionPayment(null); setAction(null); setActionError('') } }}>
          <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45" />
          <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <AlertDialog.Popup className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl outline-none">
            <Clock3 className={action === 'approve' ? 'text-emerald-600' : 'text-rose-600'} size={24} />
            <AlertDialog.Title className="mt-3 text-lg font-bold text-slate-950">{action === 'approve' ? 'Approve payment?' : 'Reject payment?'}</AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-slate-600">{action === 'approve' ? 'This will complete the payment and activate or confirm the related record.' : 'This will mark the payment failed and cancel the pending related record.'}</AlertDialog.Description>
            <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700">₹{actionPayment.amount} · {actionPayment.transaction_reference || 'No reference'}</p>
            {actionError && <p role="alert" className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-800">{actionError}</p>}
            <div className="mt-5 flex gap-3">
              <AlertDialog.Close disabled={submitting} className="flex-1 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50">Cancel</AlertDialog.Close>
              <button type="button" onClick={submitAction} disabled={submitting} className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 ${action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}>{submitting ? 'Processing...' : action === 'approve' ? 'Approve payment' : 'Reject payment'}</button>
            </div>
          </AlertDialog.Popup>
          </AlertDialog.Viewport>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      )}
    </div>
  )
}

export default AdminPayments
