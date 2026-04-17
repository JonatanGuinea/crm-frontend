import axios from 'axios'
import api from './client'

export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)
export const switchOrganization = (organizationId) => api.post('/auth/switch-organization', { organizationId })
export const getOrganizations = () => api.get('/organizations')
export const createOrganization = (name) => api.post('/organizations', { name })

// Usa axios directo para no interferir con los interceptores (401 no debe hacer logout del usuario actual)
export const acceptInvite = (inviteToken) =>
  axios.post(`${import.meta.env.VITE_API_URL}/auth/accept-invite`, {}, {
    headers: { Authorization: `Bearer ${inviteToken}` }
  })
