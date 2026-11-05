import api from './client'

export const getMemberships   = (params)   => api.get('/memberships', { params })
export const createMembership = (data)     => api.post('/memberships', data)
export const updateMembership = (id, data) => api.patch(`/memberships/${id}`, data)
export const deleteMembership = (id)       => api.delete(`/memberships/${id}`)
