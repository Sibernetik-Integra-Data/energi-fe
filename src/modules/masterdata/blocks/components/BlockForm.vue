<template>
  <MdModal
    :open="visible"
    :title="isEdit ? `Ubah Blok ${block.name}` : 'Tambah Blok'"
    subtitle="Lengkapi data blok. Kolom bertanda * wajib diisi."
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField label="Nomor blok" for-id="blok-name" required full hint="Petak di blok ini (mis. 113a, 113b) diatur di Nomor Petak." :error="errors.name">
      <input id="blok-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="20" placeholder="mis. 113" autocomplete="off" />
    </MdField>

    <MdField label="Catatan" for-id="blok-notes" full hint="Opsional.">
      <textarea id="blok-notes" v-model.trim="form.notes" class="md-input" rows="3" placeholder="Opsional" style="resize: vertical; height: auto" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">Batal</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? 'Menyimpan…' : 'Simpan' }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { MdModal, MdField, MdIcon } from '../../../shared/masterdata-ui'

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
