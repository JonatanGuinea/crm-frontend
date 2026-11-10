import api from './client'

export const getQuotes = (params) => api.get('/quotes', { params })
export const getQuoteById = (id) => api.get(`/quotes/${id}`)
export const getQuotesDashboard = (currency) => api.get('/quotes/dashboard', { params: currency ? { currency } : {} })
export const createQuote = (data) => api.post('/quotes', data)
export const updateQuote = (id, data) => api.put(`/quotes/${id}`, data)
export const deleteQuote = (id) => api.delete(`/quotes/${id}`)
// variant opcional: 'resend' (reenvío sin cambios) | 'updated' (presupuesto actualizado)
export const sendQuote = (id, variant) => api.post(`/quotes/${id}/send`, variant ? { variant } : {})
export const reactivateQuote = (id, validUntil) => api.post(`/quotes/${id}/reactivate`, { validUntil })
export const duplicateQuote  = (id)             => api.post(`/quotes/${id}/duplicate`)
// step: 'seen' (se abrió el detalle) | 'ack' (se tocó "Entendido" en el banner)
export const markRenewalRead = (id, step)       => api.post(`/quotes/${id}/renewal-read`, { step })
export const downloadQuotePdf = (id) => api.get(`/quotes/${id}/pdf`, { responseType: 'blob' })
export const getAllQuotesHistory  = ()      => api.get('/quotes/history')
export const getNextQuoteNumber  = ()      => api.get('/quotes/next-number')

export const uploadQuoteImage  = (quoteId, formData) =>
  api.post(`/quote-images/${quoteId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
export const updateQuoteImage  = (imageId, data) =>
  data instanceof FormData
    ? api.patch(`/quote-images/${imageId}`, data, { headers: { 'Content-Type': 'multipart/form-data' } })
    : api.patch(`/quote-images/${imageId}`, data)
export const deleteQuoteImage  = (imageId)       => api.delete(`/quote-images/${imageId}`)

export const createQuoteNote   = (quoteId, data) => api.post(`/quote-notes/${quoteId}`, data)
export const updateQuoteNote   = (noteId, data)  => api.patch(`/quote-notes/${noteId}`, data)
export const deleteQuoteNote   = (noteId)        => api.delete(`/quote-notes/${noteId}`)
