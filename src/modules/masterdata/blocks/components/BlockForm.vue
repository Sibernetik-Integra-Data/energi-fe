<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="onCancel">
      <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 flex flex-col gap-5">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Ubah Blok' : 'Tambah Blok' }}</h3>
          <button type="button" class="border-0 bg-transparent cursor-pointer text-(--text-soft) hover:text-(--text) text-xl leading-none" aria-label="Tutup" @click="onCancel">&times;</button>
        </div>

        <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="blok-name">Nomor Blok <span class="text-red-500">*</span></label>
            <input id="blok-name" v-model.trim="form.name" type="text" maxlength="20" placeholder="mis. 113" autocomplete="off"
              class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
              :class="errors.name ? 'border-red-400 bg-red-50' : 'border-(--border) bg-(--surface-muted) focus:border-green-500'" />
            <span v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</span>
            <span v-else class="text-xs text-(--text-soft)">Petak di blok ini (mis. 113a, 113b) diatur di Nomor Petak.</span>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="blok-notes">Catatan</label>
            <textarea id="blok-notes" v-model.trim="form.notes" rows="3" placeholder="Opsional"
              class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 resize-none" />
          </div>

          <div v-if="error" class="text-xs text-red-500">{{ error }}</div>

          <div class="flex justify-end gap-3 pt-1">
            <button type="button" class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted)" :disabled="submitting" @click="onCancel">Batal</button>
            <button type="submit" class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-green-700 disabled:opacity-60" :disabled="submitting">
              <span v-if="submitting">Menyimpan&hellip;</span>
              <span v-else>{{ isEdit ? 'Simpan Perubahan' : 'Tambah Blok' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'

const props = defineProps({
  visible: { type: Boolean, default: false },
  block: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.block?.id))
const form = ref({ name: '', notes: '' })
const errors = ref({})

watch(
  () => [props.visible, props.block],
  ([visible, b]) => {
    if (!visible) return
    errors.value = {}
    form.value = { name: b?.name || '', notes: b?.notes || '' }
  },
  { immediate: true }
)

function onSubmit() {
  errors.value = form.value.name ? {} : { name: 'Nomor blok wajib diisi.' }
  if (errors.value.name) return
  emit('submit', { name: form.value.name, notes: form.value.notes || null })
}

function onCancel() {
  emit('cancel')
}
</script>
