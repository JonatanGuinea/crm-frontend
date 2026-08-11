import api from './client'

export const getOrganizations = () => api.get('/organizations')
export const updateOrganization = (id, data) => api.patch(`/organizations/${id}`, data)
export const deleteOrganization = (id) => api.delete(`/organizations/${id}`)
export const uploadOrgLogo = (id, file) => {
  const form = new FormData()
  form.append('logo', file)
  return api.post(`/organizations/${id}/logo`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}
