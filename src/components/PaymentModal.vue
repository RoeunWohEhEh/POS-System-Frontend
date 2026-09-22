<script setup>
import { ref, computed, onMounted } from 'vue'
import { X, DollarSign, Banknote } from '@lucide/vue'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'
import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'

const emit = defineEmits(['close', 'success'])

const cart = useCartStore()
const toast = useToastStore()

const cashGiven = ref('')
const loading = ref(false)
const error = ref('')
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

// Change = cashGiven - order.total (shown after order created)
const cashGivenNum = computed(() => parseFloat(cashGiven.value) || 0)
const estimatedChange = computed(() =>
  Math.max(0, cashGivenNum.value - cart.totalAmount),
)
const canPay = computed(() =>
  cashGivenNum.value >= cart.totalAmount && cart.totalAmount > 0,
)

function fmt(n) {
  return parseFloat(n).toFixed(2)
}

async function confirmPayment() {
  if (!canPay.value) return
  loading.value = true
  error.value = ''

  try {
    // 1. Create order — response: { message, order }
    const orderRes = await orderService.store(cart.buildOrderPayload())
    const order = orderRes.data.order

    // 2. Create cash payment — amount must equal order.total exactly
    const paymentRes = await paymentService.store({
      order_id: order.id,
      method: 'cash',
      amount: parseFloat(order.total),
    })

    const { payment, order: completedOrder } = paymentRes.data

    toast.success('Payment successful!')
    isOpen.value = false
    setTimeout(() => {
      emit('success', {
        order: completedOrder,
        payment,
        change: cashGivenNum.value - parseFloat(order.total),
      })
    }, 300)
  } catch (err) {
    const msg = err.response?.data?.message || 'Payment failed. Please try again.'
    error.value = msg
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="closeModal" />

        <Transition name="slide-up">
          <div v-if="isOpen" class="relative bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div class="flex items-center gap-2">
                <Banknote class="w-5 h-5 text-emerald-600" />
                <h2 class="text-base font-bold text-gray-900">Cash Payment</h2>
              </div>
              <button @click="closeModal" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
                <X class="w-4 h-4" />
              </button>
            </div>

            <div class="p-6 space-y-4">
              <!-- Order summary -->
              <div class="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div class="flex justify-between text-gray-500">
                  <span>Subtotal</span>
                  <span>${{ fmt(cart.subtotal) }}</span>
                </div>
                <div v-if="cart.discount > 0" class="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>−${{ fmt(cart.discount) }}</span>
                </div>
                <div v-if="cart.tax > 0" class="flex justify-between text-gray-500">
                  <span>Tax</span>
                  <span>${{ fmt(cart.tax) }}</span>
                </div>
                <div class="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2 mt-2">
                  <span>Total</span>
                  <span class="text-indigo-600">${{ fmt(cart.totalAmount) }}</span>
                </div>
              </div>

              <!-- Cash given input -->
              <div>
                <label class="block text-sm font-semibold text-gray-700 mb-1.5">Cash Given</label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                    <DollarSign class="w-4 h-4" />
                  </span>
                  <input
                    id="cash-given-input"
                    v-model="cashGiven"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    autofocus
                    class="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg text-gray-900 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    @keyup.enter="confirmPayment"
                  />
                </div>
              </div>

              <!-- Quick amounts -->
              <div class="grid grid-cols-5 gap-1.5">
                <button
                  v-for="amt in [1, 5, 10, 20, 50]"
                  :key="amt"
                  @click="cashGiven = amt"
                  class="py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-400 text-gray-600 transition-colors"
                >
                  ${{ amt }}
                </button>
              </div>

              <!-- Change -->
              <Transition name="fade">
                <div
                  v-if="cashGivenNum >= cart.totalAmount && cart.totalAmount > 0"
                  class="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3"
                >
                  <span class="text-sm font-medium text-emerald-700">Change</span>
                  <span class="text-lg font-bold text-emerald-700">${{ fmt(estimatedChange) }}</span>
                </div>
              </Transition>

              <!-- Error -->
              <Transition name="fade">
                <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                  {{ error }}
                </div>
              </Transition>
            </div>

            <!-- Footer -->
            <div class="px-6 pb-6 flex gap-3">
              <button
                @click="closeModal"
                class="flex-1 py-2.5 border border-gray-300 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                id="confirm-cash-btn"
                @click="confirmPayment"
                :disabled="!canPay || loading"
                class="flex-1 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <svg v-if="loading" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                {{ loading ? 'Processing...' : 'Confirm Payment' }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
