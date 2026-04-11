import api from './client'

export const getQuotes = (params) => api.get('/quotes', { params })
export const getQuoteById = (id) => api.get(`/quotes/${id}`)
export const getQuotesDashboard = () => api.get('/quotes/dashboard')
export const createQuote = (data) => api.post('/quotes', data)
export const updateQuote = (id, data) => api.put(`/quotes/${id}`, data)
export const deleteQuote = (id) => api.delete(`/quotes/${id}`)
export const createInvoiceFromQuote = (id, data) => api.post(`/quotes/${id}/invoice`, data)
