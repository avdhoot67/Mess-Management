import api from './api'

export const getMyPayments = async () => {
  const response = await api.get('/payments')
  return response.data
}

export const downloadPaymentReceipt = async (paymentId) => {
  const response = await api.get(`/payments/${paymentId}/receipt`, {
    responseType: 'blob',
  })

  const downloadUrl = window.URL.createObjectURL(response.data)
  const link = document.createElement('a')
  link.href = downloadUrl
  link.download = `MessMate-receipt-${paymentId}.pdf`
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(downloadUrl)
}

export const getAllPayments = async () => {
  const response = await api.get('/payments/admin')
  return response.data
}

export const approvePayment = async (paymentId) => {
  const response = await api.post(`/payments/${paymentId}/approve`)
  return response.data
}

export const rejectPayment = async (paymentId) => {
  const response = await api.post(`/payments/${paymentId}/reject`)
  return response.data
}
