import api from './api'

export const getAdminAccess = async () => {
  const response = await api.get('/admin-invitations')
  return response.data
}

export const inviteAdministrator = async (email) => {
  const response = await api.post('/admin-invitations', { email })
  return response.data
}

export const revokeAdministratorInvitation = async (invitationId) => {
  const response = await api.delete(`/admin-invitations/${invitationId}`)
  return response.data
}

export const validateAdministratorInvitation = async (token) => {
  const response = await api.post('/admin-invitations/validate', { token })
  return response.data
}

export const acceptAdministratorInvitation = async (payload) => {
  const response = await api.post('/admin-invitations/accept', payload)
  return response.data
}
