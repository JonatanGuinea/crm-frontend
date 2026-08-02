import axios from 'axios'

const publicApi = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

export const getPublicQuote      = (id)       => publicApi.get(`/public/quotes/${id}`)
export const getPublicQuotePdfUrl = (id)      => `${import.meta.env.VITE_API_URL}/public/quotes/${id}/pdf`
export const confirmQuote        = (id, data) => publicApi.post(`/public/quotes/${id}/confirm`, data)
