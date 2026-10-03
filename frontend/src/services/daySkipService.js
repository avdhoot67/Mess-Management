import api from './api'

export const getMyDaySkips = async () => {
  const response = await api.get('/skips')
  return response.data
}

export const createDaySkip = async (subscription_id, skip_date) => {
  const response = await api.post('/skips', {
    subscription_id,
    skip_date,
  })

  return response.data
}