import api from './api'

// index  → direct array (no wrapper)
// store  → { message, order }
// show   → direct order object (no wrapper)
export const orderService = {
  index: () => api.get('/orders'),
  store: (data) => api.post('/orders', data),
  show: (id) => api.get(`/orders/${id}`),
}
