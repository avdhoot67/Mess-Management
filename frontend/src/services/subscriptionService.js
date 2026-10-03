import api from './api'

export const getMySubscriptions = async () => {
  const response = await api.get('/subscriptions')

  return response.data
}

export const createSubscription = async (
  planId,
  transactionReference
) => {
  const response = await api.post('/subscriptions', {
    plan_id: planId,
    transaction_reference: transactionReference,
  })

  return response.data
}

export const getAllSubscriptions = async () => {
  const response = await api.get('/subscriptions/admin')
  return response.data
}