import api from './client'

export const getInvoices = (params) => api.get('/invoices', { params })
export const getInvoiceById = (id) => api.get(`/invoices/${id}`)
export const getInvoicesDashboard = (currency) => api.get('/invoices/dashboard', { params: currency ? { currency } : {} })
export const getInvoicesMonthly = (currency) => api.get('/invoices/monthly', { params: currency ? { currency } : {} })
export const createInvoice = (data) => api.post('/invoices', data)
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data)
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`)
export const downloadInvoicePdf = (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
