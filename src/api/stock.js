import api from './client'

// Categorías
export const getCategories    = ()         => api.get('/categories')
export const createCategory   = (data)     => api.post('/categories', data)
export const updateCategory   = (id, data) => api.patch(`/categories/${id}`, data)
export const deleteCategory   = (id)       => api.delete(`/categories/${id}`)

// Productos
export const getProducts         = (params) => api.get('/products', { params })
export const getProduct          = (id)     => api.get(`/products/${id}`)
export const createProduct       = (data)   => api.post('/products', data)
export const updateProduct       = (id, data) => api.patch(`/products/${id}`, data)
export const deleteProduct       = (id)     => api.delete(`/products/${id}`)
export const getProductMovements = (id, params) => api.get(`/products/${id}/movements`, { params })

// Movimientos
export const stockIn         = (data) => api.post('/stock/in', data)
export const stockOut        = (data) => api.post('/stock/out', data)
export const stockAdjustment = (data) => api.post('/stock/adjustment', data)
export const getMovements    = (params) => api.get('/stock/movements', { params })
export const getStockDashboard = () => api.get('/stock/dashboard')
export const getStockHistory   = () => api.get('/stock/history')

// Proveedores
export const getSuppliers    = (params)     => api.get('/suppliers', { params })
export const createSupplier  = (data)       => api.post('/suppliers', data)
export const updateSupplier  = (id, data)   => api.patch(`/suppliers/${id}`, data)
export const deleteSupplier  = (id)         => api.delete(`/suppliers/${id}`)
