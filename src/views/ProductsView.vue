<script setup>
import { ref, onMounted } from 'vue'
import { productService } from '@/services/productService'
import { categoryService } from '@/services/categoryService'
import { useToastStore } from '@/stores/toast'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { Plus, Search, Edit2, Trash2, Package, X } from '@lucide/vue'

const toast = useToastStore()

const products = ref([])
const categories = ref([])
const loading = ref(true)
const search = ref('')
const saving = ref(false)
const deleting = ref(false)

const showForm = ref(false)
const editTarget = ref(null)
const confirmDelete = ref(null)

const emptyForm = () => ({
  category_id: '',
  name: '',
  sku: '',
  cost: '',
  price: '',
  stock: '',
  minimum_stock: '',
  image: '',
  status: true,
})
const form = ref(emptyForm())
const formError = ref('')

async function loadData() {
  loading.value = true
  try {
    const [prodRes, catRes] = await Promise.all([
      productService.index(),
      categoryService.index(),
    ])
    products.value = prodRes.data.data || []
    categories.value = catRes.data.data || []
  } catch {
    toast.error('Failed to load data.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editTarget.value = null
  form.value = emptyForm()
  formError.value = ''
  showForm.value = true
}

function openEdit(product) {
  editTarget.value = product
  form.value = {
    category_id: product.category_id,
    name: product.name,
    sku: product.sku,
    cost: product.cost || '',
    price: product.price,
    stock: product.stock ?? '',
    minimum_stock: product.minimum_stock ?? '',
    image: product.image || '',
    status: product.status,
  }
  formError.value = ''
  showForm.value = true
}

async function saveProduct() {
  if (!form.value.category_id || !form.value.name || !form.value.sku || !form.value.price) {
    formError.value = 'Category, name, SKU, and price are required.'
    return
  }
  saving.value = true
  formError.value = ''
  const payload = {
    ...form.value,
    cost:          form.value.cost          !== '' ? parseFloat(form.value.cost) : null,
    price:         parseFloat(form.value.price),
    stock:         form.value.stock         !== '' ? parseInt(form.value.stock)  : null,
    minimum_stock: form.value.minimum_stock !== '' ? parseInt(form.value.minimum_stock) : null,
    status:        form.value.status ? 1 : 0,
    category_id:   parseInt(form.value.category_id),
  }
  try {
    if (editTarget.value) {
      await productService.update(editTarget.value.id, payload)
      toast.success('Product updated.')
    } else {
      await productService.store(payload)
      toast.success('Product created.')
    }
    showForm.value = false
    await loadData()
  } catch (err) {
    formError.value = err.response?.data?.message ||
      Object.values(err.response?.data?.errors || {}).flat().join(' ') ||
      'Failed to save product.'
  } finally {
    saving.value = false
  }
}

async function deleteProduct() {
  if (!confirmDelete.value) return
  deleting.value = true
  try {
    await productService.destroy(confirmDelete.value.id)
    toast.success('Product deleted.')
    confirmDelete.value = null
    await loadData()
  } catch {
    toast.error('Failed to delete product.')
  } finally {
    deleting.value = false
  }
}

function filtered() {
  if (!search.value.trim()) return products.value
  const q = search.value.toLowerCase()
  return products.value.filter(
    (p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q),
  )
}

function stockStatus(p) {
  if (!p.stock || p.stock === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-700' }
  if (p.stock <= (p.minimum_stock || 5)) return { label: 'Low Stock', cls: 'bg-amber-100 text-amber-700' }
  return { label: 'In Stock', cls: 'bg-emerald-100 text-emerald-700' }
}

function fmt(n) { return parseFloat(n || 0).toFixed(2) }

onMounted(loadData)
</script>

<template>
  <div class="h-full overflow-y-auto p-6 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="products-search"
          v-model="search"
          type="text"
          placeholder="Search by name or SKU..."
          class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        id="btn-add-product"
        @click="openCreate"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus class="w-4 h-4" /> Add Product
      </button>
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
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Product</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">SKU</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Category</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Cost</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Price</th>
              <th class="text-right text-xs font-semibold text-gray-500 px-4 py-3">Stock</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Stock Status</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="filtered().length === 0">
              <td colspan="9" class="text-center py-12 text-gray-400 text-sm">
                <Package class="w-10 h-10 mx-auto mb-2 opacity-30" />
                No products found
              </td>
            </tr>
            <tr v-for="p in filtered()" :key="p.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-4 py-3 font-semibold text-gray-800">{{ p.name }}</td>
              <td class="px-4 py-3 text-gray-500 font-mono text-xs">{{ p.sku }}</td>
              <td class="px-4 py-3 text-gray-500">{{ p.category?.name || '—' }}</td>
              <td class="px-4 py-3 text-right text-gray-500">${{ fmt(p.cost) }}</td>
              <td class="px-4 py-3 text-right font-bold text-gray-900">${{ fmt(p.price) }}</td>
              <td class="px-4 py-3 text-right text-gray-700">{{ p.stock ?? '—' }}</td>
              <td class="px-4 py-3">
                <span :class="['inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold', p.status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500']">
                  {{ p.status ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span :class="['inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold', stockStatus(p).cls]">
                  {{ stockStatus(p).label }}
                </span>
              </td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2 justify-end">
                  <button @click="openEdit(p)" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button @click="confirmDelete = p" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Form Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showForm = false" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
            <h2 class="text-base font-bold text-gray-900">{{ editTarget ? 'Edit Product' : 'Add Product' }}</h2>
            <button @click="showForm = false" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="overflow-y-auto flex-1 p-6">
            <div class="grid grid-cols-2 gap-4">
              <!-- Category -->
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">Category *</label>
                <select
                  id="field-category"
                  v-model="form.category_id"
                  class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="">Select category</option>
                  <option v-for="cat in categories" :key="cat.id" :value="cat.id">{{ cat.name }}</option>
                </select>
              </div>

              <!-- Name -->
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">Name *</label>
                <input id="field-name" v-model="form.name" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="Product name" />
              </div>

              <!-- SKU -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">SKU *</label>
                <input id="field-sku" v-model="form.sku" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="SKU-001" />
              </div>

              <!-- Status -->
              <div class="flex items-end pb-1">
                <label class="flex items-center gap-2 cursor-pointer">
                  <input id="field-status" v-model="form.status" type="checkbox" class="w-4 h-4 rounded text-indigo-600" />
                  <span class="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <!-- Cost -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">Cost ($)</label>
                <input id="field-cost" v-model="form.cost" type="number" min="0" step="0.01" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
              </div>

              <!-- Price -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">Price ($) *</label>
                <input id="field-price" v-model="form.price" type="number" min="0" step="0.01" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0.00" />
              </div>

              <!-- Stock -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">Stock</label>
                <input id="field-stock" v-model="form.stock" type="number" min="0" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="0" />
              </div>

              <!-- Minimum Stock -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">Minimum Stock</label>
                <input id="field-min-stock" v-model="form.minimum_stock" type="number" min="0" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="5" />
              </div>

              <!-- Image URL -->
              <div class="col-span-2">
                <label class="block text-xs font-semibold text-gray-700 mb-1.5">Image URL</label>
                <input id="field-image" v-model="form.image" type="text" class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="https://..." />
              </div>
            </div>

            <Transition name="fade">
              <div v-if="formError" class="mt-4 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {{ formError }}
              </div>
            </Transition>
          </div>

          <div class="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
            <button @click="showForm = false" class="flex-1 py-2.5 border border-gray-300 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              id="btn-save-product"
              @click="saveProduct"
              :disabled="saving"
              class="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg v-if="saving" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ saving ? 'Saving...' : 'Save Product' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <!-- Confirm Delete -->
  <ConfirmModal
    :show="!!confirmDelete"
    title="Delete Product"
    :message="`Delete '${confirmDelete?.name}'? This cannot be undone.`"
    confirm-label="Delete"
    type="danger"
    :loading="deleting"
    @confirm="deleteProduct"
    @cancel="confirmDelete = null"
  />
</template>
