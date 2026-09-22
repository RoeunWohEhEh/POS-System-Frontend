<script setup>
import { ref, onMounted } from 'vue'
import { categoryService } from '@/services/categoryService'
import { useToastStore } from '@/stores/toast'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import ConfirmModal from '@/components/ConfirmModal.vue'
import { Plus, Search, Edit2, Trash2, Tag, X } from '@lucide/vue'

const toast = useToastStore()

const categories = ref([])
const loading = ref(true)
const search = ref('')
const showForm = ref(false)
const editTarget = ref(null)
const confirmDelete = ref(null)
const saving = ref(false)
const deleting = ref(false)

const form = ref({ name: '', status: true })
const formError = ref('')

async function loadCategories() {
  loading.value = true
  try {
    const res = await categoryService.index()
    categories.value = res.data.data || []
  } catch {
    toast.error('Failed to load categories.')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editTarget.value = null
  form.value = { name: '', status: true }
  formError.value = ''
  showForm.value = true
}

function openEdit(cat) {
  editTarget.value = cat
  form.value = { name: cat.name, status: cat.status }
  formError.value = ''
  showForm.value = true
}

async function saveCategory() {
  if (!form.value.name.trim()) {
    formError.value = 'Name is required.'
    return
  }
  saving.value = true
  formError.value = ''
  const payload = { name: form.value.name, status: form.value.status ? 1 : 0 }
  try {
    if (editTarget.value) {
      await categoryService.update(editTarget.value.id, payload)
      toast.success('Category updated.')
    } else {
      await categoryService.store(payload)
      toast.success('Category created.')
    }
    showForm.value = false
    await loadCategories()
  } catch (err) {
    formError.value = err.response?.data?.message ||
      Object.values(err.response?.data?.errors || {}).flat().join(' ') ||
      'Failed to save category.'
  } finally {
    saving.value = false
  }
}

async function deleteCategory() {
  if (!confirmDelete.value) return
  deleting.value = true
  try {
    await categoryService.destroy(confirmDelete.value.id)
    toast.success('Category deleted.')
    confirmDelete.value = null
    await loadCategories()
  } catch {
    toast.error('Failed to delete category.')
  } finally {
    deleting.value = false
  }
}

function filtered() {
  if (!search.value.trim()) return categories.value
  return categories.value.filter((c) => c.name.toLowerCase().includes(search.value.toLowerCase()))
}

onMounted(loadCategories)
</script>

<template>
  <div class="h-full overflow-y-auto p-6 space-y-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-4">
      <div class="relative flex-1 max-w-sm">
        <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          id="categories-search"
          v-model="search"
          type="text"
          placeholder="Search categories..."
          class="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <button
        id="btn-add-category"
        @click="openCreate"
        class="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
      >
        <Plus class="w-4 h-4" /> Add Category
      </button>
    </div>

    <!-- Table -->
    <div class="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div v-if="loading" class="flex items-center justify-center h-48">
        <LoadingSpinner size="lg" />
      </div>
      <div v-else class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="text-left text-xs font-semibold text-gray-500 px-6 py-3">#</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Name</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Status</th>
              <th class="text-left text-xs font-semibold text-gray-500 px-4 py-3">Created</th>
              <th class="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="filtered().length === 0">
              <td colspan="5" class="text-center py-12 text-gray-400 text-sm">
                <Tag class="w-10 h-10 mx-auto mb-2 opacity-30" />
                No categories found
              </td>
            </tr>
            <tr v-for="(cat, i) in filtered()" :key="cat.id" class="hover:bg-gray-50 transition-colors">
              <td class="px-6 py-3 text-gray-400 text-xs">{{ i + 1 }}</td>
              <td class="px-4 py-3 font-semibold text-gray-800">{{ cat.name }}</td>
              <td class="px-4 py-3">
                <span :class="['inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold', cat.status ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500']">
                  {{ cat.status ? 'Active' : 'Inactive' }}
                </span>
              </td>
              <td class="px-4 py-3 text-gray-400 text-xs">{{ new Date(cat.created_at).toLocaleDateString() }}</td>
              <td class="px-4 py-3">
                <div class="flex items-center gap-2 justify-end">
                  <button @click="openEdit(cat)" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                    <Edit2 class="w-3.5 h-3.5" />
                  </button>
                  <button @click="confirmDelete = cat" class="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>

  <!-- Form Modal -->
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showForm" class="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="showForm = false" />
        <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
          <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 class="text-base font-bold text-gray-900">{{ editTarget ? 'Edit Category' : 'Add Category' }}</h2>
            <button @click="showForm = false" class="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
              <X class="w-4 h-4" />
            </button>
          </div>
          <div class="p-6 space-y-4">
            <div>
              <label class="block text-xs font-semibold text-gray-700 mb-1.5">Name *</label>
              <input
                id="field-cat-name"
                v-model="form.name"
                type="text"
                placeholder="Category name"
                class="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                @keyup.enter="saveCategory"
              />
            </div>
            <label class="flex items-center gap-2 cursor-pointer">
              <input id="field-cat-status" v-model="form.status" type="checkbox" class="w-4 h-4 rounded text-indigo-600" />
              <span class="text-sm font-medium text-gray-700">Active</span>
            </label>
            <Transition name="fade">
              <div v-if="formError" class="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-700">{{ formError }}</div>
            </Transition>
          </div>
          <div class="flex gap-3 px-6 pb-6">
            <button @click="showForm = false" class="flex-1 py-2.5 border border-gray-300 text-sm font-semibold text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">Cancel</button>
            <button
              id="btn-save-category"
              @click="saveCategory"
              :disabled="saving"
              class="flex-1 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg v-if="saving" class="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              {{ saving ? 'Saving...' : 'Save' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>

  <ConfirmModal
    :show="!!confirmDelete"
    title="Delete Category"
    :message="`Delete '${confirmDelete?.name}'?`"
    confirm-label="Delete"
    type="danger"
    :loading="deleting"
    @confirm="deleteCategory"
    @cancel="confirmDelete = null"
  />
</template>
