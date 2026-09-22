<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const pageTitle = computed(() => route.meta?.title || 'POS System')
</script>

<template>
  <header class="h-14 bg-white border-b border-gray-200 flex items-center px-6 flex-shrink-0">
    <h1 class="text-base font-semibold text-gray-900">{{ pageTitle }}</h1>
  </header>
</template>
