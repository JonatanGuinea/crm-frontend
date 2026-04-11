import api from './client'

export const getMembers = (orgId) => api.get(`/organizations/${orgId}/members`)
export const inviteMember = (orgId, data) => api.post(`/organizations/${orgId}/members`, data)
export const updateMemberRole = (orgId, userId, role) =>
  api.patch(`/organizations/${orgId}/members/${userId}`, { role })
export const removeMember = (orgId, userId) =>
  api.delete(`/organizations/${orgId}/members/${userId}`)
