import api from './client'

export const getInvoices = (params) => api.get('/invoices', { params })
export const getInvoiceById = (id) => api.get(`/invoices/${id}`)
export const getInvoicesDashboard = () => api.get('/invoices/dashboard')
export const getInvoicesMonthly = () => api.get('/invoices/monthly')
export const createInvoice = (data) => api.post('/invoices', data)
export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data)
export const deleteInvoice = (id) => api.delete(`/invoices/${id}`)
export const downloadInvoicePdf = (id) => api.get(`/invoices/${id}/pdf`, { responseType: 'blob' })
