import { useEffect, useState } from 'react'
import { CalendarCheck } from 'lucide-react'
import { AlertDialog } from '@base-ui/react/alert-dialog'
import { motion } from 'motion/react'
import { formatDate } from '../../utils/dateUtils'
import {
  cancelBooking,
  getMyBookings,
} from '../../services/bookingService'
import BookingModal from '../../components/BookingModal'

const getTodayString = () => {
  const today = new Date()
  const year = today.getFullYear()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const statusClasses = {
  pending: 'bg-amber-50 text-amber-800',
  confirmed: 'bg-emerald-50 text-emerald-800',
  cancelled: 'bg-gray-100 text-gray-700',
}

const StudentBookings = () => {
  const today = getTodayString()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [bookingToCancel, setBookingToCancel] = useState(null)
  const [rebookMeal, setRebookMeal] = useState(null)

  const loadBookings = async () => {
    const response = await getMyBookings()
    if (response.success) {
      setBookings(response.bookings || [])
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        setError('')
        await loadBookings()
      } catch (err) {
        setError(
          err.response?.data?.message || 'Failed to load bookings'
        )
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const handleCancel = async (bookingId) => {
    try {
      setCancellingId(bookingId)
      setActionError('')
      await cancelBooking(bookingId)
      await loadBookings()
      setBookingToCancel(null)
    } catch (err) {
      setActionError(
        err.response?.data?.message || 'Failed to cancel booking'
      )
    } finally {
      setCancellingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-3" role="status" aria-label="Loading bookings">{[0, 1, 2].map((item) => <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />)}</div>
    )
  }

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
        <h1 className="text-2xl font-bold text-slate-950">My Bookings</h1>
        <p className="mt-2 text-sm text-slate-600">
          Cancel future meals or rebook a cancelled meal. Refunds are
          processed manually.
        </p>
      </div>

      {actionError && (
        <div role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center">
          <CalendarCheck className="mx-auto text-gray-400" size={28} />
          <p className="mt-3 font-medium text-gray-700">No bookings yet</p>
          <p className="mt-1 text-sm text-gray-500">
            Book a meal from the calendar or meals page.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bookings.map((booking) => {
            const canCancel =
              (booking.booking_status === 'pending' ||
                booking.booking_status === 'confirmed') &&
              booking.meal_date >= today
            const canRebook =
              booking.booking_status === 'cancelled' &&
              booking.meal_date >= today

            return (
              <motion.div
                key={booking.booking_id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="surface-wash-violet rounded-2xl border border-slate-200 p-5 shadow-sm transition duration-200 hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      {booking.meal_type}
                    </p>
                    <h2 className="mt-1 font-semibold text-gray-900">
                      {booking.menu}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                      {formatDate(booking.meal_date)} · ₹{booking.price}
                    </p>
                    <p className="mt-2 text-xs text-gray-500">
                      Payment:{' '}
                      {booking.payment_status || 'not available'}
                    </p>
                  </div>

                  <div className="flex flex-col items-start gap-2 sm:items-end">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${
                        statusClasses[booking.booking_status] ||
                        'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {booking.booking_status}
                    </span>

                    {canCancel && (
                      <button
                        type="button"
                        onClick={() => setBookingToCancel(booking)}
                        disabled={cancellingId === booking.booking_id}
                        className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                      >
                        {cancellingId === booking.booking_id
                          ? 'Cancelling...'
                          : 'Cancel booking'}
                      </button>
                    )}

                    {canRebook && (
                      <button
                        type="button"
                        onClick={() =>
                          setRebookMeal({
                            meal_id: booking.meal_id,
                            meal_date: booking.meal_date,
                            meal_type: booking.meal_type,
                            menu: booking.menu,
                            price: booking.price,
                          })
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                      >
                        Rebook
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      {rebookMeal && (
        <BookingModal
          meal={rebookMeal}
          isCoveredBySubscription={false}
          onClose={() => setRebookMeal(null)}
          onSuccess={async () => {
            setRebookMeal(null)
            await loadBookings()
          }}
        />
      )}

      {bookingToCancel && <AlertDialog.Root
        open={Boolean(bookingToCancel)}
        onOpenChange={(open) => {
          if (!open && !cancellingId) setBookingToCancel(null)
        }}
      >
        <AlertDialog.Portal>
          <AlertDialog.Backdrop className="fixed inset-0 z-50 bg-slate-950/45 transition-opacity data-[ending-style]:opacity-0" />
          <AlertDialog.Viewport className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <AlertDialog.Popup className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl outline-none">
            <AlertDialog.Title id="cancel-booking-title" className="text-lg font-bold text-gray-900">
              Cancel booking?
            </AlertDialog.Title>
            <AlertDialog.Description className="mt-2 text-sm text-gray-600">
              Cancel your {bookingToCancel.meal_type} booking for{' '}
              {formatDate(bookingToCancel.meal_date)}? Future-meal refunds are
              processed manually.
            </AlertDialog.Description>
            <div className="mt-5 flex gap-3">
              <AlertDialog.Close
                disabled={cancellingId === bookingToCancel.booking_id}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Keep booking
              </AlertDialog.Close>
              <button
                type="button"
                onClick={() => handleCancel(bookingToCancel.booking_id)}
                disabled={cancellingId === bookingToCancel.booking_id}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
              >
                {cancellingId === bookingToCancel.booking_id
                  ? 'Cancelling...'
                  : 'Cancel booking'}
              </button>
            </div>
            </AlertDialog.Popup>
          </AlertDialog.Viewport>
        </AlertDialog.Portal>
      </AlertDialog.Root>}
    </div>
  )
}

export default StudentBookings
