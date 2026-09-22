<script setup>
import { ref, computed, onMounted } from 'vue'
import { X, Printer, ShoppingCart } from '@lucide/vue'

const props = defineProps({
  order:   { type: Object, required: true },
  payment: { type: Object, required: true },
  change:  { type: Number, default: 0 },
})
const emit = defineEmits(['close', 'new-sale'])

const isOpen = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    isOpen.value = true
  })
})

function closeModal() {
  isOpen.value = false
  setTimeout(() => emit('close'), 300)
}

function handleNewSale() {
  isOpen.value = false
  setTimeout(() => emit('new-sale'), 300)
}

function fmt(n) {
  return parseFloat(n || 0).toFixed(2)
}

function formatDate(d) {
  return new Date(d).toLocaleString()
}

function printReceipt() {
  window.print()
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal" />

        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <!-- Header (hidden on print) -->
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100 print:hidden">
            <h2 class="text-base font-bold text-gray-900">Receipt</h2>
            <button @click="closeModal" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Receipt content -->
          <div id="receipt-content" class="p-6 font-mono text-sm">
            <div class="text-center mb-4">
              <p class="text-lg font-bold">POS SYSTEM</p>
              <p class="text-xs text-gray-500">{{ formatDate(order.created_at) }}</p>
            </div>

            <div class="border-t border-dashed border-gray-300 my-3" />

            <div class="space-y-1 mb-3">
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">Order</span>
                <span class="font-semibold">{{ order.order_number }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-gray-500">Payment</span>
                <span class="font-semibold">{{ payment.payment_number }}</span>
              </div>
            </div>

            <div class="border-t border-dashed border-gray-300 my-3" />

            <!-- Items -->
            <div class="space-y-1.5 mb-3">
              <div
                v-for="item in order.items"
                :key="item.id"
                class="flex items-start justify-between gap-2"
              >
                <div class="flex-1">
                  <p class="font-semibold text-xs leading-tight">{{ item.product?.name || 'Product' }}</p>
                  <p class="text-xs text-gray-400">{{ item.quantity }} × ${{ fmt(item.unit_price) }}</p>
                </div>
                <span class="font-semibold text-xs flex-shrink-0">${{ fmt(item.subtotal) }}</span>
              </div>
            </div>

            <div class="border-t border-dashed border-gray-300 my-3" />

            <!-- Totals -->
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-500">Subtotal</span>
                <span>${{ fmt(order.subtotal) }}</span>
              </div>
              <div v-if="parseFloat(order.discount) > 0" class="flex justify-between text-emerald-600">
                <span>Discount</span>
                <span>−${{ fmt(order.discount) }}</span>
              </div>
              <div v-if="parseFloat(order.tax) > 0" class="flex justify-between">
                <span class="text-gray-500">Tax</span>
                <span>${{ fmt(order.tax) }}</span>
              </div>
              <div class="flex justify-between font-bold text-base mt-2">
                <span>TOTAL</span>
                <span>${{ fmt(order.total) }}</span>
              </div>
              <div v-if="payment.method === 'cash' && change > 0" class="flex justify-between text-emerald-600">
                <span>Change</span>
                <span>${{ fmt(change) }}</span>
              </div>
            </div>

            <div class="border-t border-dashed border-gray-300 my-3" />

            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-gray-500">Method</span>
                <span class="uppercase font-semibold">{{ payment.method }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-500">Status</span>
                <span class="text-emerald-600 font-semibold uppercase">{{ payment.status }}</span>
              </div>
            </div>

            <div class="border-t border-dashed border-gray-300 my-4" />
            <p class="text-center text-xs text-gray-400">Thank you for your purchase!</p>
          </div>

          <!-- Actions (hidden on print) -->
          <div class="flex gap-3 px-6 pb-6 print:hidden">
            <button
              @click="printReceipt"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 border border-gray-300 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
            >
              <Printer class="w-4 h-4" />
              Print
            </button>
            <button
              id="new-sale-btn"
              @click="handleNewSale"
              class="flex-1 flex items-center justify-center gap-2 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 transition-colors"
            >
              <ShoppingCart class="w-4 h-4" />
              New Sale
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
