<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { X, QrCode, RefreshCw, CheckCircle } from '@lucide/vue'
import QRCode from 'qrcode'
import { useCartStore } from '@/stores/cart'
import { useToastStore } from '@/stores/toast'
import { orderService } from '@/services/orderService'
import { paymentService } from '@/services/paymentService'

const emit = defineEmits(['close', 'success'])

const cart = useCartStore()
const toast = useToastStore()

// State
const phase = ref('creating') // creating | waiting | verifying | done
const error = ref('')
const payment = ref(null)
const order = ref(null)
const qrDataUrl = ref('')
const countdown = ref(300) // 5 min
let timer = null
const autoVerifyTimer = ref(null)
const verifying = ref(false)

function fmt(n) {
  return parseFloat(n).toFixed(2)
}

// Generate QR image from the KHQR string
async function renderQR(qrString) {
  try {
    qrDataUrl.value = await QRCode.toDataURL(qrString, {
      width: 240,
      margin: 2,
      color: { dark: '#1e293b', light: '#ffffff' },
    })
  } catch {
    qrDataUrl.value = ''
  }
}

async function createKhqrPayment() {
  phase.value = 'creating'
  error.value = ''

  try {
    // 1. Create order
    const orderRes = await orderService.store(cart.buildOrderPayload())
    order.value = orderRes.data.order

    // 2. Create KHQR payment
    const paymentRes = await paymentService.store({
      order_id: order.value.id,
      method: 'khqr',
      amount: parseFloat(order.value.total),
    })

    payment.value = paymentRes.data.payment
    order.value = paymentRes.data.order

    if (!payment.value?.qr) {
      throw new Error('KHQR QR data was not returned by backend.')
    }

    // 3. Convert QR string to image
    await renderQR(payment.value.qr)

    phase.value = 'waiting'
    startCountdown()
    startAutoVerify()
  } catch (err) {
    error.value = err.response?.data?.message || err.message || 'Failed to create KHQR payment.'
    phase.value = 'creating' // stay on error state
  }
}

function startCountdown() {
  countdown.value = 300
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(timer)
      stopAutoVerify()
      error.value = 'Payment verification timed out.'
    }
  }, 1000)
}

function formatCountdown(s) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

async function checkPaymentStatus() {
  if (!payment.value) return
  if (verifying.value) return
  verifying.value = true

  try {
    const res = await paymentService.verify(payment.value.id)

    if (res.data.status === 'PAID') {
      const verifiedPayment = res.data.payment
      const completedOrder = res.data.order

      stopAutoVerify()
      clearInterval(timer)
      phase.value = 'done'
      error.value = ''
      toast.success('KHQR payment verified!')

      setTimeout(() => {
        emit('success', { order: completedOrder, payment: verifiedPayment, change: 0 })
      }, 1500)
    } else if (res.data.status === 'PENDING') {
      console.log('Waiting for payment...')
    }
  } catch (err) {
    // If backend returns 422 or error, we just continue polling unless it's a critical error
    // In POS we typically just suppress polling errors to not spam the UI and let the timeout handle the rest
    console.error('Auto verify error', err)
  } finally {
    verifying.value = false
  }
}

function startAutoVerify() {
  autoVerifyTimer.value = setInterval(() => {
    checkPaymentStatus()
  }, 3000)
}

function stopAutoVerify() {
  if (autoVerifyTimer.value) {
    clearInterval(autoVerifyTimer.value)
    autoVerifyTimer.value = null
  }
}

function closeKHQR() {
  stopAutoVerify()
  clearInterval(timer)
  emit('close')
}

onMounted(createKhqrPayment)
onUnmounted(() => {
  clearInterval(timer)
  stopAutoVerify()
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="phase === 'waiting' && closeKHQR()" />

        <Transition name="slide-up">
          <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            <!-- Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div class="flex items-center gap-2">
                <QrCode class="w-5 h-5 text-indigo-600" />
                <h2 class="text-base font-bold text-gray-900">KHQR Payment</h2>
              </div>
              <button
                v-if="phase === 'waiting'"
                @click="closeKHQR"
                class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X class="w-4 h-4" />
              </button>
            </div>

            <!-- Creating state -->
            <div v-if="phase === 'creating'" class="flex flex-col items-center gap-4 p-10">
              <svg class="animate-spin w-10 h-10 text-indigo-600" viewBox="0 0 24 24" fill="none">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              <p class="text-sm text-gray-500">Generating KHQR payment...</p>
              <div v-if="error" class="w-full bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-center">
                {{ error }}
                <button @click="createKhqrPayment" class="block mt-2 mx-auto text-indigo-600 font-semibold hover:underline">Retry</button>
              </div>
            </div>

            <!-- Waiting / QR state -->
            <div v-else-if="phase === 'waiting' || phase === 'verifying'" class="p-6 space-y-4">
              <!-- Amount -->
              <div class="text-center">
                <p class="text-sm text-gray-500">Amount to pay</p>
                <p class="text-3xl font-bold text-indigo-600 mt-1">${{ fmt(order?.total || 0) }}</p>
                <p class="text-xs text-gray-400 mt-1">Order: {{ order?.order_number }}</p>
              </div>

              <!-- QR Code -->
              <div class="flex justify-center">
                <div class="bg-white border-2 border-indigo-100 rounded-2xl p-3 shadow-inner">
                  <img
                    v-if="qrDataUrl"
                    :src="qrDataUrl"
                    alt="KHQR Code"
                    class="w-48 h-48"
                  />
                  <div v-else class="w-48 h-48 flex flex-col items-center justify-center gap-3 bg-indigo-50 rounded-xl">
                    <QrCode class="w-16 h-16 text-indigo-300" />
                    <p class="text-xs text-indigo-400 text-center px-4">
                      Payment #{{ payment?.payment_number }}<br/>
                      Scan in Bakong app
                    </p>
                  </div>
                </div>
              </div>

              <!-- Countdown -->
              <div v-if="countdown > 0" class="text-center text-xs text-gray-400">
                Expires in <span class="font-semibold text-amber-600">{{ formatCountdown(countdown) }}</span>
              </div>
              <div v-else class="text-center text-xs text-red-500 font-semibold">QR expired — please try again</div>

              <!-- Error -->
              <Transition name="fade">
                <div v-if="error" class="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700 text-center">
                  {{ error }}
                </div>
              </Transition>

              <!-- Actions -->
              <div class="flex gap-3">
                <button
                  @click="closeKHQR"
                  class="flex-1 py-2.5 border border-gray-300 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>

            <!-- Done state -->
            <div v-else-if="phase === 'done'" class="flex flex-col items-center gap-4 p-10">
              <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle class="w-9 h-9 text-emerald-600" />
              </div>
              <p class="text-lg font-bold text-gray-900">Payment Verified!</p>
              <p class="text-sm text-gray-500">Order completed successfully.</p>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
