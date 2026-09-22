import api from './api'

// Response shape: { success: true, data: [...products with category] }
export const productService = {
  index: () => api.get('/products'),
  store: (data) => api.post('/products', data),
  show: (id) => api.get(`/products/${id}`),
  update: (id, data) => api.put(`/products/${id}`, data),
  destroy: (id) => api.delete(`/products/${id}`),
}
