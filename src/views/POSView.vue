<script setup>
import { ref, computed, onMounted } from 'vue'
import { productService } from '@/services/productService'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'
import ProductCard from '@/components/ProductCard.vue'
import CartItem from '@/components/CartItem.vue'
import PaymentModal from '@/components/PaymentModal.vue'
import KHQRModal from '@/components/KHQRModal.vue'
import ReceiptModal from '@/components/ReceiptModal.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { Search, ShoppingCart, Trash2, Tag } from '@lucide/vue'
import { categoryService } from '@/services/categoryService'

const cart = useCartStore()
const toast = useToastStore()

// State
const products = ref([])
const categories = ref([])
const search = ref('')
const selectedCategory = ref(null)
const loadingProducts = ref(true)

const showPaymentModal = ref(false)  // cash
const showKhqrModal = ref(false)
const showReceipt = ref(false)
const receiptData = ref({ order: null, payment: null, change: 0 })

// Filters
const filteredProducts = computed(() => {
  let list = products.value.filter((p) => p.status) // active only
  if (selectedCategory.value !== null) {
    list = list.filter((p) => p.category_id === selectedCategory.value)
  }
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    list = list.filter((p) => p.name.toLowerCase().includes(q) || p.sku?.toLowerCase().includes(q))
  }
  return list
})

async function loadProducts() {
  loadingProducts.value = true
  try {
    const [prodRes, catRes] = await Promise.all([
      productService.index(),
      categoryService.index(),
    ])
    products.value = prodRes.data.data || []
    categories.value = catRes.data.data || []
  } catch {
    toast.error('Failed to load products.')
  } finally {
    loadingProducts.value = false
  }
}

function onPaymentSuccess(data) {
  showPaymentModal.value = false
  showKhqrModal.value = false
  receiptData.value = data
  showReceipt.value = true
  cart.clearCart()
}

function onNewSale() {
  showReceipt.value = false
  receiptData.value = { order: null, payment: null, change: 0 }
}

function fmt(n) {
  return parseFloat(n || 0).toFixed(2)
}

onMounted(loadProducts)
</script>

<template>
  <div class="flex h-full overflow-hidden bg-gray-50">

    <!-- ── Left: Products Panel ── -->
    <div class="flex-1 flex flex-col overflow-hidden border-r border-gray-200">
      <!-- Search + Category filter -->
      <div class="p-4 bg-white border-b border-gray-200 space-y-3">
        <div class="relative">
          <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="pos-search"
            v-model="search"
            type="text"
            placeholder="Search products by name or SKU..."
            class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <!-- Category tabs -->
        <div class="flex gap-2 overflow-x-auto pb-0.5">
          <button
            @click="selectedCategory = null"
            :class="[
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
              selectedCategory === null
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ]"
          >
            <Tag class="w-3 h-3" /> All
          </button>
          <button
            v-for="cat in categories"
            :key="cat.id"
            @click="selectedCategory = cat.id"
            :class="[
              'px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors',
              selectedCategory === cat.id
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
            ]"
          >
            {{ cat.name }}
          </button>
        </div>
      </div>

      <!-- Products grid -->
      <div class="flex-1 overflow-y-auto p-4">
        <div v-if="loadingProducts" class="flex items-center justify-center h-48">
          <LoadingSpinner size="lg" />
        </div>

        <div v-else-if="filteredProducts.length === 0" class="flex flex-col items-center justify-center h-48 text-gray-400">
          <ShoppingCart class="w-12 h-12 mb-3 opacity-30" />
          <p class="text-sm">No products found</p>
        </div>

        <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <ProductCard
            v-for="product in filteredProducts"
            :key="product.id"
            :product="product"
            @add="cart.addItem(product)"
          />
        </div>
      </div>
    </div>

    <!-- ── Right: Cart Panel ── -->
    <div class="w-80 xl:w-96 flex-shrink-0 flex flex-col bg-white overflow-hidden">
      <!-- Cart header -->
      <div class="flex items-center justify-between px-4 py-3.5 border-b border-gray-200">
        <div class="flex items-center gap-2">
          <ShoppingCart class="w-4.5 h-4.5 text-gray-600" />
          <h2 class="text-sm font-bold text-gray-800">Cart</h2>
          <span
            v-if="cart.itemCount > 0"
            class="inline-flex items-center justify-center w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold"
          >
            {{ cart.itemCount }}
          </span>
        </div>
        <button
          v-if="cart.items.length > 0"
          @click="cart.clearCart()"
          class="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors"
        >
          <Trash2 class="w-3.5 h-3.5" /> Clear
        </button>
      </div>

      <!-- Items -->
      <div class="flex-1 overflow-y-auto px-4 py-2">
        <div v-if="cart.items.length === 0" class="flex flex-col items-center justify-center h-40 text-gray-400">
          <ShoppingCart class="w-10 h-10 mb-2 opacity-30" />
          <p class="text-sm">Cart is empty</p>
          <p class="text-xs mt-1">Click products to add</p>
        </div>

        <TransitionGroup name="fade" tag="div">
          <CartItem
            v-for="item in cart.items"
            :key="item.product.id"
            :item="item"
            @update="(qty) => cart.updateQty(item.product.id, qty)"
            @remove="cart.removeItem(item.product.id)"
          />
        </TransitionGroup>
      </div>

      <!-- Totals + controls -->
      <div class="border-t border-gray-200 p-4 space-y-3">
        <!-- Discount row -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-gray-500 w-20 flex-shrink-0">Discount $</label>
          <input
            id="discount-input"
            type="number"
            min="0"
            step="0.01"
            :value="cart.discount"
            @change="cart.setDiscount($event.target.value)"
            placeholder="0.00"
            class="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <!-- Tax row -->
        <div class="flex items-center gap-2">
          <label class="text-xs font-semibold text-gray-500 w-20 flex-shrink-0">Tax $</label>
          <input
            id="tax-input"
            type="number"
            min="0"
            step="0.01"
            :value="cart.tax"
            @change="cart.setTax($event.target.value)"
            placeholder="0.00"
            class="flex-1 px-2.5 py-1.5 border border-gray-200 rounded-lg text-sm text-right focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>

        <!-- Totals -->
        <div class="bg-gray-50 rounded-xl p-3 space-y-1.5 text-sm">
          <div class="flex justify-between text-gray-500 text-xs">
            <span>Subtotal</span>
            <span>${{ fmt(cart.subtotal) }}</span>
          </div>
          <div v-if="cart.discount > 0" class="flex justify-between text-emerald-600 text-xs">
            <span>Discount</span>
            <span>−${{ fmt(cart.discount) }}</span>
          </div>
          <div v-if="cart.tax > 0" class="flex justify-between text-gray-500 text-xs">
            <span>Tax</span>
            <span>${{ fmt(cart.tax) }}</span>
          </div>
          <div class="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-1">
            <span>Total</span>
            <span class="text-indigo-600">${{ fmt(cart.totalAmount) }}</span>
          </div>
        </div>

        <!-- Payment buttons -->
        <div class="grid grid-cols-2 gap-2">
          <button
            id="btn-cash"
            :disabled="cart.items.length === 0"
            @click="showPaymentModal = true"
            class="py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            💵 CASH
          </button>
          <button
            id="btn-khqr"
            :disabled="cart.items.length === 0"
            @click="showKhqrModal = true"
            class="py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm"
          >
            📱 KHQR
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- Modals -->
  <PaymentModal
    v-if="showPaymentModal"
    @close="showPaymentModal = false"
    @success="onPaymentSuccess"
  />

  <KHQRModal
    v-if="showKhqrModal"
    @close="showKhqrModal = false"
    @success="onPaymentSuccess"
  />

  <ReceiptModal
    v-if="showReceipt && receiptData.order"
    :order="receiptData.order"
    :payment="receiptData.payment"
    :change="receiptData.change"
    @close="showReceipt = false"
    @new-sale="onNewSale"
  />
</template>
