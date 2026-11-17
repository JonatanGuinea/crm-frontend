import api from './client'

// Panel de sistema — solo administradores del sistema (el backend valida cada pedido)
const clean = params => Object.fromEntries(Object.entries(params || {}).filter(([, v]) => v !== '' && v != null))

export const getAdminOverview = () => api.get('/admin/overview')
export const updateOrganizationPlan = (orgId, plan) => api.patch(`/admin/organizations/${orgId}/plan`, { plan })

export const getAdminDashboard = period => api.get('/admin/dashboard', { params: { period } }).then(r => r.data.data)

export const getAdminOrganizations = params => api.get('/admin/organizations', { params: clean(params) }).then(r => r.data.data)
export const getAdminOrganization = id => api.get(`/admin/organizations/${id}`).then(r => r.data.data)
export const setOrganizationStatus = (id, status, reason) => api.patch(`/admin/organizations/${id}/status`, { status, reason })

export const getAdminUsers = params => api.get('/admin/users', { params: clean(params) }).then(r => r.data.data)
export const getAdminUser = id => api.get(`/admin/users/${id}`).then(r => r.data.data)
export const setUserStatus = (id, disabled, reason) => api.patch(`/admin/users/${id}/status`, { disabled, reason })

export const getExplorerEntities = () => api.get('/admin/explorer/entities').then(r => r.data.data)
export const getExplorerRecords = (entity, params) => api.get(`/admin/explorer/${entity}`, { params: clean(params) }).then(r => r.data.data)
export const getExplorerRecord = (entity, id) => api.get(`/admin/explorer/${entity}/${id}`).then(r => r.data.data)
export const getExplorerOrphans = () => api.get('/admin/explorer/orphans').then(r => r.data.data)

export const getAdminFinance = params => api.get('/admin/finance', { params: clean(params) }).then(r => r.data.data)

export const getAdminAudit = params => api.get('/admin/audit', { params: clean(params) }).then(r => r.data.data)
export const getAdminAuditFilters = () => api.get('/admin/audit/filters').then(r => r.data.data)
export const getAdminAuditEvent = id => api.get(`/admin/audit/${id}`).then(r => r.data.data)

export const getAdminInfra = fresh => api.get('/admin/infra', { params: fresh ? { fresh: 1 } : {} }).then(r => r.data.data)
export const getAdminBackups = () => api.get('/admin/backups').then(r => r.data.data)
export const runAdminBackup = () => api.post('/admin/backups/run', { confirm: true }).then(r => r.data.data)

// Descarga un CSV/Excel con los mismos filtros de la pantalla. Devuelve la cantidad aproximada de filas.
export async function downloadAdminExport(dataset, params) {
  const res = await api.get(`/admin/export/${encodeURIComponent(dataset)}`, { params: clean(params), responseType: 'blob' })
  const disposition = res.headers['content-disposition'] || ''
  const filename = /filename="([^"]+)"/.exec(disposition)?.[1] || `danteup-${dataset}.${params.format}`
  const url = URL.createObjectURL(res.data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return Number(res.headers['x-row-count'] ?? 0)
}
