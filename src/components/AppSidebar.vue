<script setup>
import { computed } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useToastStore } from '@/stores/toast'
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Tag,
  Layers,
  ClipboardList,
  LogOut,
  Store,
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const toast = useToastStore()

const allLinks = [
  { name: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, adminOnly: true },
  { name: 'pos',       label: 'POS',       icon: ShoppingCart,    adminOnly: false },
  { name: 'orders',    label: 'Orders',    icon: ClipboardList,   adminOnly: false },
  { name: 'products',  label: 'Products',  icon: Package,         adminOnly: true  },
  { name: 'categories',label: 'Categories',icon: Tag,             adminOnly: true  },
  { name: 'inventory', label: 'Inventory', icon: Layers,          adminOnly: true  },
]

const navLinks = computed(() =>
  allLinks.filter((l) => !l.adminOnly || auth.isAdmin),
)

async function handleLogout() {
  await auth.logout()
  toast.success('Logged out successfully')
  router.push({ name: 'login' })
}

const userInitial = computed(() =>
  auth.user?.name?.charAt(0)?.toUpperCase() || 'U',
)
</script>

<template>
  <aside class="w-64 flex-shrink-0 bg-slate-900 flex flex-col h-full">
    <!-- Brand -->
    <div class="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
      <div class="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
        <Store class="w-5 h-5 text-white" />
      </div>
      <span class="text-white font-bold text-base tracking-tight">POS System</span>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
      <RouterLink
        v-for="link in navLinks"
        :key="link.name"
        :to="{ name: link.name }"
        class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150"
        :class="
          route.name === link.name
            ? 'bg-indigo-600 text-white'
            : 'text-slate-400 hover:text-white hover:bg-slate-800'
        "
      >
        <component :is="link.icon" class="w-4.5 h-4.5 flex-shrink-0" />
        {{ link.label }}
      </RouterLink>
    </nav>

    <!-- User + Logout -->
    <div class="border-t border-slate-700/50 px-4 py-4">
      <div class="flex items-center gap-3 mb-3">
        <div class="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {{ userInitial }}
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold text-white truncate">{{ auth.user?.name || 'User' }}</p>
          <p class="text-xs text-slate-400 truncate">{{ auth.user?.role?.name || '' }}</p>
        </div>
      </div>
      <button
        id="sidebar-logout-btn"
        @click="handleLogout"
        class="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors duration-150"
      >
        <LogOut class="w-4 h-4" />
        Sign out
      </button>
    </div>
  </aside>
</template>
