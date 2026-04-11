import api from './client'

export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const switchOrganization = (organizationId) => api.post('/auth/switch-organization', { organizationId })
export const getOrganizations = () => api.get('/organizations')
