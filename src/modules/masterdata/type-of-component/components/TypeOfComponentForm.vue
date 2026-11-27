<template>
  <MdModal
    :open="visible"
    :title="isEdit ? `Ubah Jenis Komponen ${typeOfComponent.name || ''}` : 'Tambah Jenis Komponen'"
    subtitle="Lengkapi data jenis komponen. Kolom bertanda * wajib diisi."
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField label="Nama" for-id="toc-name" required full hint="Maksimal 100 karakter." :error="errors.name">
      <input id="toc-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="100" placeholder="mis. Biaya" autocomplete="off" />
    </MdField>

    <MdField label="Keterangan" for-id="toc-detail" full hint="Opsional, maksimal 500 karakter." :error="errors.detail">
      <textarea id="toc-detail" v-model.trim="form.detail" class="md-input" :class="{ 'is-invalid': errors.detail }" rows="3" maxlength="500" placeholder="Keterangan (opsional)" />
    </MdField>

    <MdField label="Catatan" for-id="toc-notes" full hint="Opsional, maksimal 500 karakter." :error="errors.notes">
      <textarea id="toc-notes" v-model.trim="form.notes" class="md-input" :class="{ 'is-invalid': errors.notes }" rows="3" maxlength="500" placeholder="Catatan (opsional)" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">Batal</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Simpan' }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { MdModal, MdField, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  typeOfComponent: { type: Object, default: null },
  rows: { type: Array, default: () => [] }, // untuk cek nama ganda
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.typeOfComponent?.id))
const emptyForm = () => ({ name: '', detail: '', notes: '' })
const form = ref(emptyForm())
const errors = ref({})

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    const t = props.typeOfComponent
    form.value = t ? { name: t.name || '', detail: t.detail || '', notes: t.notes || '' } : emptyForm()
    errors.value = {}
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  const f = form.value
  if (!f.name) errs.name = 'Nama wajib diisi.'
  else if (f.name.length > 100) errs.name = 'Nama maksimal 100 karakter.'
  else if (props.rows.some((r) => r.id !== props.typeOfComponent?.id && String(r.name || '').toLowerCase() === f.name.toLowerCase())) errs.name = `Jenis komponen ${f.name} sudah ada.`
  if (f.detail && f.detail.length > 500) errs.detail = 'Keterangan maksimal 500 karakter.'
  if (f.notes && f.notes.length > 500) errs.notes = 'Catatan maksimal 500 karakter.'
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { name: form.value.name, detail: form.value.detail || null, notes: form.value.notes || null })
}

function onCancel() {
  emit('cancel')
}
</script>
