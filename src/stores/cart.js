import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])   // [{ product: {...}, quantity: number }]
  const discount = ref(0) // flat dollar discount
  const tax = ref(0)      // flat dollar tax

  const subtotal = computed(() =>
    items.value.reduce((sum, i) => sum + parseFloat(i.product.price) * i.quantity, 0),
  )

  const totalAmount = computed(() =>
    Math.max(0, subtotal.value - discount.value + tax.value),
  )

  const itemCount = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0),
  )

  function addItem(product) {
    if (!product.status) return // inactive product
    const existing = items.value.find((i) => i.product.id === product.id)
    if (existing) {
      if (existing.quantity < product.stock) existing.quantity++
    } else {
      if (product.stock > 0) items.value.push({ product, quantity: 1 })
    }
  }

  function removeItem(productId) {
    items.value = items.value.filter((i) => i.product.id !== productId)
  }

  function updateQty(productId, qty) {
    const item = items.value.find((i) => i.product.id === productId)
    if (!item) return
    if (qty <= 0) {
      removeItem(productId)
    } else {
      item.quantity = Math.min(qty, item.product.stock)
    }
  }

  function setDiscount(val) {
    discount.value = Math.max(0, parseFloat(val) || 0)
  }

  function setTax(val) {
    tax.value = Math.max(0, parseFloat(val) || 0)
  }

  function clearCart() {
    items.value = []
    discount.value = 0
    tax.value = 0
  }

  // Build the payload for POST /orders
  function buildOrderPayload() {
    return {
      discount: discount.value,
      tax: tax.value,
      items: items.value.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      })),
    }
  }

  return {
    items,
    discount,
    tax,
    subtotal,
    totalAmount,
    itemCount,
    addItem,
    removeItem,
    updateQty,
    setDiscount,
    setTax,
    clearCart,
    buildOrderPayload,
  }
})
