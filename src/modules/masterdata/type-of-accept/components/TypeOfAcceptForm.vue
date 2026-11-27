<template>
  <MdModal
    :open="visible"
    :title="isEdit ? `Ubah Status Penugasan ${typeOfAccept.name || ''}` : 'Tambah Status Penugasan'"
    subtitle="Lengkapi data status penugasan. Kolom bertanda * wajib diisi."
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField label="Nama" for-id="toa-name" required hint="Kode status, maksimal 100 karakter." :error="errors.name">
      <input id="toa-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="100" placeholder="mis. Approve" autocomplete="off" />
    </MdField>

    <MdField label="Label status" for-id="toa-status" required hint="Teks yang tampil ke pengguna, maksimal 100 karakter." :error="errors.status">
      <input id="toa-status" v-model.trim="form.status" class="md-input" :class="{ 'is-invalid': errors.status }" maxlength="100" placeholder="mis. Diterima" autocomplete="off" list="toa-status-list" />
      <datalist id="toa-status-list">
        <option v-for="s in statusSuggestions" :key="s" :value="s" />
      </datalist>
    </MdField>

    <MdField label="Keterangan" for-id="toa-detail" full hint="Opsional, maksimal 500 karakter." :error="errors.detail">
      <textarea id="toa-detail" v-model.trim="form.detail" class="md-input" :class="{ 'is-invalid': errors.detail }" rows="3" maxlength="500" placeholder="Keterangan (opsional)" />
    </MdField>

    <MdField label="Catatan" for-id="toa-notes" full hint="Opsional, maksimal 500 karakter." :error="errors.notes">
      <textarea id="toa-notes" v-model.trim="form.notes" class="md-input" :class="{ 'is-invalid': errors.notes }" rows="3" maxlength="500" placeholder="Catatan (opsional)" />
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
  typeOfAccept: { type: Object, default: null },
  rows: { type: Array, default: () => [] }, // untuk cek nama ganda & saran label
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.typeOfAccept?.id))
const statusSuggestions = computed(() => [...new Set(props.rows.map((r) => r.status).filter(Boolean))].sort())
const emptyForm = () => ({ name: '', detail: '', notes: '', status: '' })
const form = ref(emptyForm())
const errors = ref({})

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    const t = props.typeOfAccept
    form.value = t ? { name: t.name || '', detail: t.detail || '', notes: t.notes || '', status: t.status || '' } : emptyForm()
    errors.value = {}
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  const f = form.value
  if (!f.name) errs.name = 'Nama wajib diisi.'
  else if (f.name.length > 100) errs.name = 'Nama maksimal 100 karakter.'
  else if (props.rows.some((r) => r.id !== props.typeOfAccept?.id && String(r.name || '').toLowerCase() === f.name.toLowerCase())) errs.name = `Status penugasan ${f.name} sudah ada.`
  if (f.detail && f.detail.length > 500) errs.detail = 'Keterangan maksimal 500 karakter.'
  if (f.notes && f.notes.length > 500) errs.notes = 'Catatan maksimal 500 karakter.'
  if (!f.status) errs.status = 'Label status wajib diisi.'
  else if (f.status.length > 100) errs.status = 'Status maksimal 100 karakter.'
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  const f = form.value
  emit('submit', { name: f.name, detail: f.detail || null, notes: f.notes || null, status: f.status || null })
}

function onCancel() {
  emit('cancel')
}
</script>
