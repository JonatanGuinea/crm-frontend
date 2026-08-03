import api from './client'

export const getTasks       = (params)   => api.get('/tasks', { params })
export const createTask     = (data)     => api.post('/tasks', data)
export const updateTask     = (id, data) => api.put(`/tasks/${id}`, data)
export const deleteTask     = (id)       => api.delete(`/tasks/${id}`)
export const clearDoneTasks  = ()         => api.delete('/tasks/done/all')
export const getTaskHistory  = ()         => api.get('/tasks/history')
