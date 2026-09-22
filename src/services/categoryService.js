import api from './api'

// Response shape: { success: true, data: [...categories] }
export const categoryService = {
  index: () => api.get('/categories'),
  store: (data) => api.post('/categories', data),
  show: (id) => api.get(`/categories/${id}`),
  update: (id, data) => api.put(`/categories/${id}`, data),
  destroy: (id) => api.delete(`/categories/${id}`),
}
