<script setup>
import { Trash2, AlertTriangle, X } from '@lucide/vue'

const props = defineProps({
  show:         { type: Boolean, default: false },
  title:        { type: String,  default: 'Confirm Action' },
  message:      { type: String,  default: 'Are you sure?' },
  confirmLabel: { type: String,  default: 'Confirm' },
  cancelLabel:  { type: String,  default: 'Cancel' },
  type:         { type: String,  default: 'danger' }, // danger | warning
  loading:      { type: Boolean, default: false },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="emit('cancel')" />

        <!-- Modal -->
        <div class="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
          <div class="flex items-start gap-4">
            <!-- Icon -->
            <div
              class="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
              :class="type === 'danger' ? 'bg-red-100' : 'bg-amber-100'"
            >
              <component
                :is="type === 'danger' ? Trash2 : AlertTriangle"
                class="w-5 h-5"
                :class="type === 'danger' ? 'text-red-600' : 'text-amber-600'"
              />
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <h3 class="text-base font-semibold text-gray-900">{{ title }}</h3>
              <p class="mt-1 text-sm text-gray-500">{{ message }}</p>
            </div>

            <button @click="emit('cancel')" class="text-gray-400 hover:text-gray-600 p-1 rounded">
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-3 mt-6">
            <button
              @click="emit('cancel')"
              class="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              {{ cancelLabel }}
            </button>
            <button
              id="confirm-modal-btn"
              @click="emit('confirm')"
              :disabled="loading"
              class="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50"
              :class="type === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-500 hover:bg-amber-600'"
            >
              <span v-if="loading" class="inline-flex items-center gap-2">
                <svg class="animate-spin w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                Processing...
              </span>
              <span v-else>{{ confirmLabel }}</span>
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>
