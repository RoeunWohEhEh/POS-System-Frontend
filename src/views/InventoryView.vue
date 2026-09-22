<script setup>
import { ref, computed, onMounted } from 'vue'
import { productService } from '@/services/productService'
import { useToastStore } from '@/stores/toast'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { Search, Layers, AlertTriangle } from '@lucide/vue'

const toast = useToastStore()
const products = ref([])
const loading = ref(true)
const search = ref('')
const filterStatus = ref('all') // all | in-stock | low-stock | out-of-stock

async function loadInventory() {
  loading.value = true
  try {
    const res = await productService.index()
    products.value = res.data.data || []
  } catch {
    toast.error('Failed to load inventory.')
  } finally {
    loading.value = false
  }
}

function stockStatus(p) {
  const s = p.stock ?? 0
  const min = p.minimum_stock ?? 0
  if (s === 0)   return { key: 'out-of-stock', label: 'Out of Stock',  cls: 'bg-red-100 text-red-700' }
  if (s <= min)  return { key: 'low-stock',    label: 'Low Stock',     cls: 'bg-amber-100 text-amber-700' }
  return               { key: 'in-stock',      label: 'In Stock',      cls: 'bg-emerald-100 text-emerald-700' }
}

const filtered = computed(() => {
  let list = products.value
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
  }
  if (filterStatus.value !== 'all') {
    list = list.filter((p) => stockStatus(p).key === filterStatus.value)
  }
  return list
})

const summary = computed(() => ({
  inStock:    products.value.filter((p) => stockStatus(p).key === 'in-stock').length,
  lowStock:   products.value.filter((p) => stockStatus(p).key === 'low-stock').length,
  outOfStock: products.value.filter((p) => stockStatus(p).key === 'out-of-stock').length,
}))

onMounted(loadInventory)
</script>

<template>
  <div class="h-full overflow-y-auto p-6 space-y-4">
    <!-- Summary chips -->
    <div class="flex gap-3 flex-wrap">
      <button
        v-for="(count, key) in [
          { key: 'all',          label: 'All',          cls: 'bg-gray-100 text-gray-600',        count: products.length },
          { key: 'in-stock',     label: 'In Stock',     cls: 'bg-emerald-100 text-emerald-700', count: summary.inStock },
          { key: 'low-stock',    label: 'Low Stock',    cls: 'bg-amber-100 text-amber-700',     count: summary.lowStock },
          { key: 'out-of-stock', label: 'Out of Stock', cls: 'bg-red-100 text-red-700',         count: summary.outOfStock },
        ]"
        :key="count.key"
        @click="filterStatus = count.key"
        :class="[
          'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
          count.cls,
          filterStatus === count.key ? 'ring-2 ring-offset-1 ring-current' : 'opacity-70 hover:opacity-100',
        ]"
      >
        {{ count.label }} ({{ count.count }})
      </button>

      <div class="relative ml-auto">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="inventory-search"
          v-model="search"
          type="text"
          placeholder="Search..."
          class="pl-9 pr-4 py-1.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
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
              <th class="text-left text-xs font-semibold text-gray-500 px-6 py-3">Product</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">SKU</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Category</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Current Stock</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Min. Stock</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="filtered.length === 0">
              <td colspan="6" class="text-center py-12 text-gray-400 text-sm">
                <Layers class="w-10 h-10 mx-auto mb-2 opacity-30" />
                No items found
              </td>
            </tr>
            <tr
              v-for="p in filtered"
              :key="p.id"
              class="hover:bg-gray-50 transition-colors"
              :class="stockStatus(p).key === 'out-of-stock' ? 'bg-red-50/30' : stockStatus(p).key === 'low-stock' ? 'bg-amber-50/30' : ''"
            >
              <td class="px-6 py-3 font-semibold text-gray-800">{{ p.name }}</td>
              <td class="px-4 py-3 text-gray-400 font-mono text-xs">{{ p.sku }}</td>
              <td class="px-4 py-3 text-gray-500">{{ p.category?.name || '—' }}</td>
              <td class="px-4 py-3 text-right">
                <span :class="['font-bold', stockStatus(p).key === 'out-of-stock' ? 'text-red-600' : stockStatus(p).key === 'low-stock' ? 'text-amber-600' : 'text-gray-900']">
                  {{ p.stock ?? 0 }}
                </span>
              </td>
              <td class="px-4 py-3 text-right text-gray-500">{{ p.minimum_stock ?? 0 }}</td>
              <td class="px-4 py-3">
                <span :class="['inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', stockStatus(p).cls]">
                  <AlertTriangle v-if="stockStatus(p).key !== 'in-stock'" class="w-3 h-3" />
                  {{ stockStatus(p).label }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
