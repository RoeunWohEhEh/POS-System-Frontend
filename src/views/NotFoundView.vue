<script setup>
import { useRouter } from 'vue-router'
import { Home } from '@lucide/vue'

const router = useRouter()
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center p-6">
    <div class="text-center">
      <p class="text-8xl font-black text-indigo-200 mb-4">404</p>
      <h1 class="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
      <p class="text-gray-500 mb-8">The page you're looking for doesn't exist.</p>
      <button
        @click="router.push('/')"
        class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
      >
        <Home class="w-4 h-4" />
        Back to Home
      </button>
    </div>
  </div>
</template>
