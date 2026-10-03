import api from './api'

export const getPlans = async () => {
  const response = await api.get('/plans')

  return response.data
}

export const createPlan = async (payload) => {
  const response = await api.post('/plans', payload)
  return response.data
}

export const updatePlan = async (planId, payload) => {
  const response = await api.put(`/plans/${planId}`, payload)
  return response.data
}