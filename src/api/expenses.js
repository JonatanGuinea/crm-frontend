import api from './client'

export const getCategories = () => api.get('/expenses/categories')
export const createCategory = (data) => api.post('/expenses/categories', data)
export const deleteCategory = (id) => api.delete(`/expenses/categories/${id}`)

export const getExpenses = (params) => api.get('/expenses', { params })
export const getExpensesDashboard = () => api.get('/expenses/dashboard')
export const createExpense = (data) => api.post('/expenses', data)
export const updateExpense = (id, data) => api.put(`/expenses/${id}`, data)
export const deleteExpense = (id) => api.delete(`/expenses/${id}`)
