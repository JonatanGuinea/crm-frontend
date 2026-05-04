import api from './client'

export const getRecentActivity = () => api.get('/activity')
