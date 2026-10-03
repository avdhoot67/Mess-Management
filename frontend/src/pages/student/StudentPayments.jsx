import { useEffect, useState } from 'react'
import { CreditCard, Download } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { formatDate } from '../../utils/dateUtils'
import {
  downloadPaymentReceipt,
  getMyPayments,
} from '../../services/paymentService'

const paymentStatusClasses = {
  pending: 'bg-amber-50 text-amber-800',
  completed: 'bg-emerald-50 text-emerald-800',
  failed: 'bg-rose-50 text-rose-800',
}
const paymentFilterClasses = {
  active: 'bg-emerald-600 text-white',
  inactive: 'bg-slate-50 text-slate-700 hover:bg-slate-100',
}

const StudentPayments = () => {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadingId, setDownloadingId] = useState(null)
  const [receiptError, setReceiptError] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const shouldReduceMotion = useReducedMotion()

  const handleReceiptDownload = async (paymentId) => {
    try {
      setDownloadingId(paymentId)
      setReceiptError('')
      await downloadPaymentReceipt(paymentId)
    } catch (err) {
      setReceiptError(
        err.response?.data?.message || 'Failed to download payment receipt'
      )
    } finally {
      setDownloadingId(null)
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        const response = await getMyPayments()
        if (response.success) setPayments(response.payments || [])
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load payments')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-label="Loading payments"><div className="h-20 animate-pulse rounded-2xl bg-slate-200/70" /><div className="h-64 animate-pulse rounded-2xl bg-slate-200/70" /></div>
    )
  }

  const visiblePayments = payments.filter(
    (payment) => statusFilter === 'all' || payment.payment_status === statusFilter
  )

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-950">Payments</h1>
        <p className="mt-2 text-sm text-slate-600">
          Subscription and booking payments awaiting or completed after
          manual verification.
        </p>
      </div>

      {receiptError && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {receiptError}
        </div>
      )}

      {payments.length > 0 && <section className="surface-wash-cool flex flex-wrap gap-2 rounded-2xl border border-slate-200 p-3 shadow-sm" aria-label="Payment status filters">
        {['all', 'pending', 'completed', 'failed'].map((status) => {
          const count = status === 'all' ? payments.length : payments.filter((payment) => payment.payment_status === status).length
          return <button key={status} type="button" onClick={() => setStatusFilter(status)} className={`rounded-lg px-3 py-2 text-sm font-semibold capitalize transition ${paymentFilterClasses[statusFilter === status ? 'active' : 'inactive']}`}>{status} ({count})</button>
        })}
      </section>}

      {payments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <CreditCard className="mx-auto text-gray-400" size={28} />
          <p className="mt-3 font-medium text-gray-700">No payments yet</p>
        </div>
      ) : visiblePayments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center"><p className="font-semibold text-slate-900">No payments in this status</p><p className="mt-1 text-sm text-slate-600">Choose another filter to review your payment history.</p></div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Receipt</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {visiblePayments.map((payment) => (
                  <motion.tr key={payment.payment_id} layout initial={shouldReduceMotion ? false : { opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }} transition={{ duration: shouldReduceMotion ? 0 : 0.16 }} className="border-b border-slate-50 transition hover:bg-emerald-50/35">
                    <td className="px-4 py-3 text-slate-700">{formatDate(payment.payment_date?.slice(0, 10))}</td>
                    <td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold capitalize text-slate-700">{payment.payment_type}</span></td>
                    <td className="px-4 py-3 font-semibold text-slate-900">₹{payment.amount}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600">{payment.transaction_reference || '—'}</td>
                    <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${paymentStatusClasses[payment.payment_status] || 'bg-slate-100 text-slate-700'}`}>{payment.payment_status}</span></td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => handleReceiptDownload(payment.payment_id)} disabled={downloadingId === payment.payment_id} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50">
                        <Download size={15} />
                        {downloadingId === payment.payment_id ? 'Preparing...' : 'Receipt'}
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default StudentPayments
