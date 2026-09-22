import api from './client'

export const getDefaultTasks   = (orgId)           => api.get(`/organizations/${orgId}/default-tasks`)
export const createDefaultTask = (orgId, data)      => api.post(`/organizations/${orgId}/default-tasks`, data)
export const updateDefaultTask = (orgId, id, data)  => api.patch(`/organizations/${orgId}/default-tasks/${id}`, data)
export const deleteDefaultTask = (orgId, id)        => api.delete(`/organizations/${orgId}/default-tasks/${id}`)
export const reorderDefaultTasks = (orgId, ids)     => api.put(`/organizations/${orgId}/default-tasks/order`, { ids })
