import api from './api'

// store  → { message, payment, order }
// verify → { message, payment, order }
// show   → direct payment object
export const paymentService = {
  index: () => api.get('/payments'),
  store: (data) => api.post('/payments', data),
  show: (id) => api.get(`/payments/${id}`),
  verify: (id) => api.post(`/payments/${id}/verify`, {}),
}
