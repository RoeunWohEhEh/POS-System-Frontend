<script setup>
import { Plus, Package } from '@lucide/vue'

const props = defineProps({
  product: { type: Object, required: true },
})
const emit = defineEmits(['add'])

function fmt(n) {
  return parseFloat(n).toFixed(2)
}

const isOutOfStock = props.product.stock === 0
const isInactive   = !props.product.status
const isDisabled   = isOutOfStock || isInactive
</script>

<template>
  <button
    class="relative flex flex-col bg-white border rounded-xl p-3 text-left transition-all duration-150 group"
    :class="
      isDisabled
        ? 'opacity-50 cursor-not-allowed border-gray-200'
        : 'border-gray-200 hover:border-indigo-400 hover:shadow-md cursor-pointer'
    "
    :disabled="isDisabled"
    @click="!isDisabled && emit('add', product)"
  >
    <!-- Image or icon -->
    <div class="w-full aspect-square rounded-lg bg-indigo-50 flex items-center justify-center mb-2 overflow-hidden">
      <img
        v-if="product.image"
        :src="product.image"
        :alt="product.name"
        class="w-full h-full object-cover"
      />
      <Package v-else class="w-8 h-8 text-indigo-300" />
    </div>

    <!-- Info -->
    <p class="text-xs font-semibold text-gray-800 line-clamp-2 leading-tight mb-1">{{ product.name }}</p>
    <p class="text-sm font-bold text-indigo-600">${{ fmt(product.price) }}</p>

    <!-- Stock badge -->
    <div class="mt-1.5">
      <span
        class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
        :class="
          isOutOfStock
            ? 'bg-red-100 text-red-600'
            : product.stock <= (product.minimum_stock || 5)
              ? 'bg-amber-100 text-amber-700'
              : 'bg-emerald-100 text-emerald-700'
        "
      >
        {{ isOutOfStock ? 'Out of stock' : `${product.stock} left` }}
      </span>
    </div>

    <!-- Add overlay -->
    <div
      v-if="!isDisabled"
      class="absolute top-2 right-2 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow"
    >
      <Plus class="w-4 h-4" />
    </div>
  </button>
</template>
