import { useState } from 'react'
import { X } from 'lucide-react'
import { Dialog } from '@base-ui/react/dialog'
import { motion } from 'motion/react'
import { formatDate } from '../utils/dateUtils'
import { createBooking } from '../services/bookingService'

const BookingModal = ({
  meal,
  isCoveredBySubscription,
  onClose,
  onSuccess,
}) => {
  const [step, setStep] = useState(
    isCoveredBySubscription ? 'confirm' : 'payment'
  )
  const [transactionReference, setTransactionReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!meal) return null

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!transactionReference.trim()) {
      setError('Transaction reference is required')
      return
    }

    try {
      setLoading(true)
      setError('')

      const response = await createBooking(
        meal.meal_id,
        transactionReference.trim()
      )

      if (response.success) {
        onSuccess(response)
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit this booking'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog.Root open={Boolean(meal)} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45 transition-opacity data-[ending-style]:opacity-0" />
        <Dialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <Dialog.Popup className="w-full max-w-md outline-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.98, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl"
            >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
              {meal.meal_type}
            </p>
            <Dialog.Title
              id="booking-modal-title"
              className="mt-1 text-lg font-bold text-gray-900"
            >
              {step === 'confirm' ? 'Extra meal' : 'Confirm booking'}
            </Dialog.Title>
          </div>

          <Dialog.Close
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100"
            aria-label="Close booking form"
          >
            <X size={18} />
          </Dialog.Close>
        </div>

        <Dialog.Description className="mt-2 text-sm text-gray-600">
          {meal.menu}
        </Dialog.Description>
        <p className="mt-1 text-sm text-gray-500">
          {formatDate(meal.meal_date)} · ₹{meal.price}
        </p>

        {step === 'confirm' ? (
          <div className="mt-5">
            <div className="rounded-xl bg-amber-50 p-4 text-sm text-amber-800">
              This meal is already covered by your subscription. Do you still
              want to book it separately?
            </div>

            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setStep('payment')}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
              >
                Book separately
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <p className="text-sm text-gray-600">
              Amount is taken from the meal price. Enter the transaction /
              reference number for manual verification.
            </p>

            <div>
              <label
                htmlFor="transaction_reference"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Transaction reference
              </label>
              <input
                id="transaction_reference"
                value={transactionReference}
                onChange={(event) =>
                  setTransactionReference(event.target.value)
                }
                required
                minLength={6}
                maxLength={100}
                pattern="[A-Za-z0-9][A-Za-z0-9_-]{5,99}"
                title="Use 6 to 100 letters, numbers, hyphens, or underscores"
                placeholder="e.g. UPI123456"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
            </div>

            {error && (
              <div role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit booking'}
              </button>
            </div>
          </form>
        )}
            </motion.div>
          </Dialog.Popup>
        </Dialog.Viewport>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default BookingModal
