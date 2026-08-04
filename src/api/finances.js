import api from './client'

// Dashboard
export const getFinancesDashboard = (params) => api.get('/finances/dashboard', { params })

// Categorías financieras
export const getFinancialCategories = (params) => api.get('/financial-categories', { params })
export const createFinancialCategory = (data) => api.post('/financial-categories', data)
export const updateFinancialCategory = (id, data) => api.patch(`/financial-categories/${id}`, data)
export const deleteFinancialCategory = (id) => api.delete(`/financial-categories/${id}`)
export const seedFinancialCategories = () => api.post('/financial-categories/seed')

// Cuentas
export const getCashAccounts = () => api.get('/cash-accounts')
export const createCashAccount = (data) => api.post('/cash-accounts', data)
export const updateCashAccount = (id, data) => api.patch(`/cash-accounts/${id}`, data)
export const deleteCashAccount    = (id) => api.delete(`/cash-accounts/${id}`)
export const setDefaultCashAccount = (id) => api.patch(`/cash-accounts/${id}/set-default`)

// Movimientos
export const getCashMovements = (params) => api.get('/cash-movements', { params })
export const getCashMovement = (id) => api.get(`/cash-movements/${id}`)
export const createCashMovement = (data) => api.post('/cash-movements', data)
export const createTransfer = (data) => api.post('/cash-movements/transfer', data)
export const updateCashMovement = (id, data) => api.patch(`/cash-movements/${id}`, data)
export const confirmCashMovement = (id) => api.post(`/cash-movements/${id}/confirm`)
export const annulCashMovement = (id, data) => api.post(`/cash-movements/${id}/annul`, data)
export const deleteCashMovement = (id) => api.delete(`/cash-movements/${id}`)
