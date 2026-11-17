import api from './client'

// Panel de sistema — solo administradores del sistema
export const getAdminOverview = () => api.get('/admin/overview')
export const updateOrganizationPlan = (orgId, plan) =>
  api.patch(`/admin/organizations/${orgId}/plan`, { plan })
