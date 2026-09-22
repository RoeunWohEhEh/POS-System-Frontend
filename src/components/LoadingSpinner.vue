<script setup>
defineProps({
  size: { type: String, default: 'md' },   // sm | md | lg | xl
  color: { type: String, default: 'indigo' },
})
</script>

<template>
  <div class="flex items-center justify-center">
    <svg
      class="animate-spin"
      :class="{
        'w-4 h-4': size === 'sm',
        'w-6 h-6': size === 'md',
        'w-10 h-10': size === 'lg',
        'w-16 h-16': size === 'xl',
        'text-indigo-600': color === 'indigo',
        'text-white': color === 'white',
        'text-gray-400': color === 'gray',
      }"
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  </div>
</template>
