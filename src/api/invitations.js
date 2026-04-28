import api from './client'

export const getPendingInvitations = () => api.get('/invitations')
export const acceptInvitation = (membershipId) => api.post(`/invitations/${membershipId}/accept`)
export const declineInvitation = (membershipId) => api.delete(`/invitations/${membershipId}`)
