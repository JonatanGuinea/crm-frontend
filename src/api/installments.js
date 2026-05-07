import api from './client'

export const getInstallments = (params) => api.get('/installments', { params })
export const createInstallments = (data) => api.post('/installments', data)
export const payInstallment = (id) => api.patch(`/installments/${id}/pay`)
export const deleteInstallments = (params) => api.delete('/installments', { params })
