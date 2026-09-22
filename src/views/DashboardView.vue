<script setup>
import { ref, onMounted } from 'vue'
import { orderService } from '@/services/orderService'
import { productService } from '@/services/productService'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import {
  DollarSign, ShoppingBag, Package, AlertTriangle, TrendingUp
} from '@lucide/vue'

const loading = ref(true)
const orders = ref([])
const products = ref([])

const stats = ref({
  todaySales: 0,
  todayOrders: 0,
  totalProducts: 0,
  lowStockCount: 0,
})

function fmt(n) {
  return parseFloat(n || 0).toFixed(2)
}

function isToday(dateStr) {
  if (!dateStr) return false
  const d = new Date(dateStr)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

async function loadData() {
  loading.value = true
  try {
    const [ordersRes, productsRes] = await Promise.allSettled([
      orderService.index(),
      productService.index(),
    ])

    if (ordersRes.status === 'fulfilled') {
      // Orders index returns array directly
      orders.value = ordersRes.value.data || []
      const todayOrders = orders.value.filter((o) => isToday(o.created_at))
      stats.value.todayOrders = todayOrders.length
      stats.value.todaySales = todayOrders
        .filter((o) => o.status === 'completed')
        .reduce((s, o) => s + parseFloat(o.total || 0), 0)
    }

    if (productsRes.status === 'fulfilled') {
      products.value = productsRes.value.data.data || []
      stats.value.totalProducts = products.value.length
      stats.value.lowStockCount = products.value.filter(
        (p) => p.stock <= (p.minimum_stock || 0) && p.stock > 0,
      ).length
    }
  } finally {
    loading.value = false
  }
}

const recentOrders = () => orders.value.slice(0, 8)

function statusClass(s) {
  return {
    completed: 'bg-emerald-100 text-emerald-700',
    pending:   'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600'
}

onMounted(loadData)
</script>

<template>
  <div class="h-full overflow-y-auto p-6 space-y-6">
    <!-- KPI cards -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div class="w-11 h-11 bg-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <DollarSign class="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Today's Sales</p>
          <p class="text-xl font-bold text-gray-900 mt-0.5">${{ fmt(stats.todaySales) }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div class="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShoppingBag class="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Today's Orders</p>
          <p class="text-xl font-bold text-gray-900 mt-0.5">{{ stats.todayOrders }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div class="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <Package class="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Total Products</p>
          <p class="text-xl font-bold text-gray-900 mt-0.5">{{ stats.totalProducts }}</p>
        </div>
      </div>

      <div class="bg-white rounded-xl border border-gray-200 p-5 flex items-center gap-4">
        <div class="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <AlertTriangle class="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p class="text-xs font-medium text-gray-500">Low Stock</p>
          <p class="text-xl font-bold text-gray-900 mt-0.5">{{ stats.lowStockCount }}</p>
        </div>
      </div>
    </div>

    <!-- Loading state -->
    <div v-if="loading" class="flex items-center justify-center h-48">
      <LoadingSpinner size="lg" />
    </div>

    <!-- Recent orders -->
    <div v-else class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div class="flex items-center gap-2 px-6 py-4 border-b border-gray-100">
        <TrendingUp class="w-4 h-4 text-gray-400" />
        <h2 class="text-sm font-bold text-gray-800">Recent Orders</h2>
      </div>

      <div v-if="recentOrders().length === 0" class="flex items-center justify-center h-32 text-sm text-gray-400">
        No orders yet
      </div>

      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="text-left text-xs font-semibold text-gray-500 px-6 py-3">Order</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Items</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Total</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-for="order in recentOrders()" :key="order.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-3 font-semibold text-gray-800">{{ order.order_number }}</td>
              <td class="px-4 py-3 text-gray-500">{{ order.items?.length || 0 }}</td>
              <td class="px-4 py-3 text-right font-bold text-gray-900">${{ fmt(order.total) }}</td>
              <td class="px-4 py-3">
                <span :class="['inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', statusClass(order.status)]">
                  {{ order.status }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ new Date(order.created_at).toLocaleDateString() }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
