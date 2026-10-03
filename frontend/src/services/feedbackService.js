import api from './api'

export const getMyFeedback = async () => {
  const response = await api.get('/feedback')
  return response.data
}

export const createFeedback = async ({ meal_id, rating, message }) => {
  const response = await api.post('/feedback', {
    meal_id,
    rating,
    message,
  })
  return response.data
}

export const getAllFeedback = async () => {
  const response = await api.get('/feedback/admin')
  return response.data
}

export const generateFeedbackInsights = async ({ start_date, end_date, meal_type }) => {
  const response = await api.post('/feedback/admin/insights/generate', {
    start_date,
    end_date,
    meal_type: meal_type || undefined,
  })
  return response.data
}
