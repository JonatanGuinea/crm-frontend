import api from './client'

export const getQuotes = (params) => api.get('/quotes', { params })
export const getQuoteById = (id) => api.get(`/quotes/${id}`)
export const getQuotesDashboard = (currency) => api.get('/quotes/dashboard', { params: currency ? { currency } : {} })
export const createQuote = (data) => api.post('/quotes', data)
export const updateQuote = (id, data) => api.put(`/quotes/${id}`, data)
export const deleteQuote = (id) => api.delete(`/quotes/${id}`)
export const sendQuote = (id) => api.post(`/quotes/${id}/send`)
export const downloadQuotePdf = (id) => api.get(`/quotes/${id}/pdf`, { responseType: 'blob' })
export const getAllQuotesHistory  = ()      => api.get('/quotes/history')
