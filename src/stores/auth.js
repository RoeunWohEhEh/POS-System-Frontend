import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/services/authService'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isAuthenticated = computed(() => !!token.value)
  const userRole = computed(() => user.value?.role?.name || null)
  const isAdmin = computed(() => userRole.value?.toLowerCase() === 'admin')
  const isStaff = computed(() => userRole.value?.toLowerCase() === 'staff')

  async function login(email, password) {
    const res = await authService.login(email, password)
    // Response: { message, token, user: { ..., role: { id, name } } }
    token.value = res.data.token
    user.value = res.data.user
    localStorage.setItem('token', res.data.token)
    localStorage.setItem('user', JSON.stringify(res.data.user))
    return res.data
  }

  async function logout() {
    try {
      await authService.logout()
    } catch {
      // silently ignore — still clear local state
    } finally {
      token.value = null
      user.value = null
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
  }

  async function fetchMe() {
    try {
      const res = await authService.me()
      user.value = res.data
      localStorage.setItem('user', JSON.stringify(res.data))
    } catch {
      // non-critical
    }
  }

  return { token, user, isAuthenticated, userRole, isAdmin, isStaff, login, logout, fetchMe }
})
