import api from './api'

export const getMyBookings = async () => {
  const response = await api.get('/bookings')

  return response.data
}

export const createBooking = async (
  mealId,
  transactionReference
) => {
  const response = await api.post('/bookings', {
    meal_id: mealId,
    transaction_reference: transactionReference,
  })

  return response.data
}

export const cancelBooking = async (bookingId) => {
  const response = await api.patch(
    `/bookings/${bookingId}/cancel`
  )

  return response.data
}

export const getAllBookings = async () => {
  const response = await api.get('/bookings/admin')
  return response.data
}