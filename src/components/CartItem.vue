<script setup>
import { computed } from 'vue'
import { Minus, Plus, Trash2 } from '@lucide/vue'

const props = defineProps({
  item: { type: Object, required: true }, // { product, quantity }
})
const emit = defineEmits(['update', 'remove'])

const lineTotal = computed(() =>
  (parseFloat(props.item.product.price) * props.item.quantity).toFixed(2),
)

function fmt(n) {
  return parseFloat(n).toFixed(2)
}
</script>

<template>
  <div class="flex items-center gap-2 py-2.5 border-b border-gray-100 last:border-0">
    <!-- Name + unit price -->
    <div class="flex-1 min-w-0">
      <p class="text-sm font-semibold text-gray-800 truncate">{{ item.product.name }}</p>
      <p class="text-xs text-gray-400">${{ fmt(item.product.price) }} ea</p>
    </div>

    <!-- Qty stepper -->
    <div class="flex items-center gap-1 flex-shrink-0">
      <button
        @click="emit('update', item.quantity - 1)"
        class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
      >
        <Minus class="w-3 h-3" />
      </button>

      <span class="w-7 text-center text-sm font-bold text-gray-800">{{ item.quantity }}</span>

      <button
        @click="emit('update', item.quantity + 1)"
        :disabled="item.quantity >= item.product.stock"
        class="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Plus class="w-3 h-3" />
      </button>
    </div>

    <!-- Line total -->
    <span class="w-14 text-right text-sm font-bold text-gray-800 flex-shrink-0">${{ lineTotal }}</span>

    <!-- Remove -->
    <button
      @click="emit('remove')"
      class="p-1 text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
    >
      <Trash2 class="w-4 h-4" />
    </button>
  </div>
</template>
