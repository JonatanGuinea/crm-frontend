import api from './client'

export const getProjects = (params) => api.get('/projects', { params })
export const getProjectById = (id) => api.get(`/projects/${id}`)
export const getProjectsDashboard = () => api.get('/projects/dashboard')
export const createProject = (data) => api.post('/projects', data)
export const updateProject = (id, data) => api.put(`/projects/${id}`, data)
export const deleteProject = (id) => api.delete(`/projects/${id}`)
