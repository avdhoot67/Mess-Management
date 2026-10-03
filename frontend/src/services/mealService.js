import api from './api'

export const getMeals = async (date) => {
  const response = await api.get('/meals', {
    params: date ? { date } : {},
  })

  return response.data
}

export const getMealById = async (mealId) => {
  const response = await api.get(`/meals/${mealId}`)

  return response.data
}

export const createMeal = async (payload) => {
  const response = await api.post('/meals', payload)
  return response.data
}

export const updateMeal = async (mealId, payload) => {
  const response = await api.put(`/meals/${mealId}`, payload)
  return response.data
}

export const deleteMeal = async (mealId) => {
  const response = await api.delete(`/meals/${mealId}`)
  return response.data
}