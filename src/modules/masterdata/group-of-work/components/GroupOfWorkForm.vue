<template>
  <MdModal
    :open="visible"
    :title="isEdit ? 'Ubah Kelompok Pekerjaan' : 'Tambah Kelompok Pekerjaan'"
    subtitle="Lengkapi data kelompok. Kolom bertanda * wajib diisi."
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField label="Nama" for-id="gow-name" required full hint="Maksimal 100 karakter." :error="errors.name">
      <input
        id="gow-name"
        v-model.trim="form.name"
        class="md-input"
        :class="{ 'is-invalid': errors.name }"
        type="text"
        placeholder="mis. Pembersihan"
        maxlength="100"
        autocomplete="off"
        :aria-invalid="!!errors.name" />
    </MdField>

    <MdField label="Jenis TPH" required full hint="Pekerjaan di kelompok ini hanya bisa memakai TPH berjenis ini.">
      <MdSegmented v-model="form.tph_type" aria-label="Jenis TPH" :options="tphOptions" />
    </MdField>

    <MdField label="Keterangan" for-id="gow-detail" full hint="Opsional.">
      <textarea id="gow-detail" v-model="form.detail" class="md-input" rows="4" placeholder="Keterangan (opsional)" maxlength="2000" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">Batal</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Kelompok' }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { MdModal, MdField, MdSegmented, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  group: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.group?.id))
const tphOptions = [
  { value: 'PERAWATAN', label: 'Perawatan' },
  { value: 'PANEN', label: 'Panen' }
]

const emptyForm = () => ({ name: '', detail: '', tph_type: 'PERAWATAN' })
const form = ref(emptyForm())
const errors = ref({})

watch(
  () => [props.visible, props.group],
  ([visible, group]) => {
    if (!visible) return
    form.value = group ? { name: group.name || '', detail: group.detail || '', tph_type: group.tph_type || 'PERAWATAN' } : emptyForm()
    errors.value = {}
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  if (!form.value.name) errs.name = 'Nama wajib diisi.'
  else if (form.value.name.length > 100) errs.name = 'Nama maksimal 100 karakter.'
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { name: form.value.name, detail: form.value.detail, tph_type: form.value.tph_type })
}

function onCancel() {
  emit('cancel')
}
</script>
