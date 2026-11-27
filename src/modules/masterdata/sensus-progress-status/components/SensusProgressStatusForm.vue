<template>
  <MdModal
    :open="visible"
    :title="isEdit ? 'Ubah Status' : 'Tambah Status'"
    subtitle="Lengkapi data status. Kolom bertanda * wajib diisi."
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField label="Nama" for-id="sps-name" required full hint="Maksimal 100 karakter." :error="errors.name">
      <input
        id="sps-name"
        v-model.trim="form.name"
        class="md-input"
        :class="{ 'is-invalid': errors.name }"
        type="text"
        placeholder="mis. In Progress"
        maxlength="100"
        autocomplete="off"
        aria-required="true"
        :aria-invalid="Boolean(errors.name)" />
    </MdField>

    <MdField label="Keterangan" for-id="sps-detail" full hint="Opsional, maksimal 500 karakter." :error="errors.detail">
      <textarea id="sps-detail" v-model.trim="form.detail" class="md-input" :class="{ 'is-invalid': errors.detail }" rows="3" maxlength="500" placeholder="Keterangan (opsional)" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">Batal</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Status' }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { MdModal, MdField, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  status: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.status?.id))

const emptyForm = () => ({ name: '', detail: '' })
const form = ref(emptyForm())
const errors = ref({})

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    form.value = props.status ? { name: props.status.name || '', detail: props.status.detail || '' } : emptyForm()
    errors.value = {}
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  if (!form.value.name) errs.name = 'Nama wajib diisi.'
  else if (form.value.name.length > 100) errs.name = 'Nama maksimal 100 karakter.'
  if (form.value.detail && form.value.detail.length > 500) errs.detail = 'Keterangan maksimal 500 karakter.'
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  const payload = { name: form.value.name }
  if (form.value.detail) payload.detail = form.value.detail
  emit('submit', payload)
}

function onCancel() {
  emit('cancel')
}
</script>
