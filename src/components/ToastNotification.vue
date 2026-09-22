<script setup>
import { useToastStore } from '@/stores/toast'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from '@lucide/vue'

const toast = useToastStore()

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const colors = {
  success: 'bg-white border-l-4 border-emerald-500',
  error:   'bg-white border-l-4 border-red-500',
  warning: 'bg-white border-l-4 border-amber-500',
  info:    'bg-white border-l-4 border-blue-500',
}

const iconColors = {
  success: 'text-emerald-500',
  error:   'text-red-500',
  warning: 'text-amber-500',
  info:    'text-blue-500',
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-80">
      <TransitionGroup name="toast">
        <div
          v-for="t in toast.toasts"
          :key="t.id"
          :class="['flex items-start gap-3 p-4 rounded-lg shadow-lg', colors[t.type]]"
        >
          <component
            :is="icons[t.type]"
            class="w-5 h-5 flex-shrink-0 mt-0.5"
            :class="iconColors[t.type]"
          />
          <p class="flex-1 text-sm text-gray-700 font-medium">{{ t.message }}</p>
          <button @click="toast.remove(t.id)" class="text-gray-400 hover:text-gray-600 flex-shrink-0">
            <X class="w-4 h-4" />
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
