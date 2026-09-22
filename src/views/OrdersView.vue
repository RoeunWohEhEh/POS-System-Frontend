<script setup>
import { ref, onMounted } from 'vue'
import { orderService } from '@/services/orderService'
import { useToastStore } from '@/stores/toast'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { Search, ClipboardList, ChevronDown, ChevronUp } from '@lucide/vue'

const toast = useToastStore()
const orders = ref([])
const loading = ref(true)
const search = ref('')
const expandedId = ref(null)

async function loadOrders() {
  loading.value = true
  try {
    // Orders index returns array directly (no wrapper)
    const res = await orderService.index()
    orders.value = Array.isArray(res.data) ? res.data : []
  } catch {
    toast.error('Failed to load orders.')
  } finally {
    loading.value = false
  }
}

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function filtered() {
  if (!search.value.trim()) return orders.value
  const q = search.value.toLowerCase()
  return orders.value.filter((o) => o.order_number?.toLowerCase().includes(q))
}

function statusCls(s) {
  return {
    completed: 'bg-emerald-100 text-emerald-700',
    pending:   'bg-amber-100 text-amber-700',
    cancelled: 'bg-red-100 text-red-700',
  }[s] || 'bg-gray-100 text-gray-600'
}

function methodCls(m) {
  return {
    cash: 'bg-green-100 text-green-700',
    khqr: 'bg-indigo-100 text-indigo-700',
    card: 'bg-blue-100 text-blue-700',
  }[m] || 'bg-gray-100 text-gray-600'
}

function fmt(n) { return parseFloat(n || 0).toFixed(2) }

onMounted(loadOrders)
</script>

<template>
  <div class="h-full overflow-y-auto p-6 space-y-4">
    <!-- Search -->
    <div class="flex items-center gap-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="orders-search"
          v-model="search"
          type="text"
          placeholder="Search by order number..."
          class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <span class="text-sm text-gray-400">{{ orders.length }} total orders</span>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="w-8 px-4 py-3"></th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Order</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Items</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Subtotal</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Discount</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Total</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Payment</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="filtered().length === 0">
              <td colspan="9" class="text-center py-12 text-gray-400 text-sm">
                <ClipboardList class="w-10 h-10 mx-auto mb-2 opacity-30" />
                No orders found
              </td>
            </tr>
            <template v-for="order in filtered()" :key="order.id">
              <!-- Main row -->
              <tr
                class="border-t border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                @click="toggleExpand(order.id)"
              >
                <td class="px-4 py-3 text-gray-400">
                  <component :is="expandedId === order.id ? ChevronUp : ChevronDown" class="w-4 h-4" />
                </td>
                <td class="px-4 py-3 font-semibold text-gray-800 font-mono text-xs">{{ order.order_number }}</td>
                <td class="px-4 py-3 text-right text-gray-500">{{ order.items?.length || 0 }}</td>
                <td class="px-4 py-3 text-right text-gray-600">${{ fmt(order.subtotal) }}</td>
                <td class="px-4 py-3 text-right text-emerald-600">{{ parseFloat(order.discount) > 0 ? '-$' + fmt(order.discount) : '—' }}</td>
                <td class="px-4 py-3 text-right font-bold text-gray-900">${{ fmt(order.total) }}</td>
                <td class="px-4 py-3">
                  <div class="flex gap-1 flex-wrap">
                    <span
                      v-for="pay in order.payments"
                      :key="pay.id"
                      :class="['inline-block px-1.5 py-0.5 rounded text-[10px] font-bold uppercase', methodCls(pay.method)]"
                    >{{ pay.method }}</span>
                    <span v-if="!order.payments?.length" class="text-gray-400 text-xs">—</span>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <span :class="['inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold capitalize', statusCls(order.status)]">
                    {{ order.status }}
                  </span>
                </td>
                <td class="px-4 py-3 text-gray-400 text-xs">{{ new Date(order.created_at).toLocaleString() }}</td>
              </tr>

              <!-- Expanded items row -->
              <tr v-if="expandedId === order.id" class="bg-indigo-50/30">
                <td colspan="9" class="px-8 py-3">
                  <div class="text-xs space-y-1">
                    <p class="font-semibold text-gray-600 mb-2">Order Items</p>
                    <div v-for="item in order.items" :key="item.id" class="flex justify-between text-gray-600">
                      <span>{{ item.product?.name || 'Product' }} × {{ item.quantity }}</span>
                      <span>${{ fmt(item.subtotal) }}</span>
                    </div>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
