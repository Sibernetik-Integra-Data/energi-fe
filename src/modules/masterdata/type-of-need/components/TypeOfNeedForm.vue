<template>
  <MdModal
    :open="visible"
    :title="isEdit ? `Ubah Jenis Kebutuhan ${typeOfNeed.name || ''}` : 'Tambah Jenis Kebutuhan'"
    subtitle="Lengkapi data jenis kebutuhan. Kolom bertanda * wajib diisi."
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField label="Nama" for-id="ton-name" required hint="Maksimal 100 karakter." :error="errors.name">
      <input id="ton-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="100" placeholder="mis. Upah Kerja" autocomplete="off" />
    </MdField>

    <MdField label="Satuan" for-id="ton-unit" required :hint="unitsError || 'Sumber: Data Master → Satuan'" :error="errors.unit_id">
      <MdDropdown
        id="ton-unit"
        v-model="form.unit_id"
        field
        :invalid="!!errors.unit_id"
        :disabled="unitsLoading"
        :placeholder="unitsLoading ? 'Memuat…' : 'Pilih satuan'"
        :options="units.map((u) => ({ value: u.id, label: u.detail ? `${u.name} · ${u.detail}` : u.name }))" />
    </MdField>

    <MdField label="Keterangan" for-id="ton-detail" full hint="Opsional, maksimal 500 karakter." :error="errors.detail">
      <textarea id="ton-detail" v-model.trim="form.detail" class="md-input" :class="{ 'is-invalid': errors.detail }" rows="3" maxlength="500" placeholder="Keterangan (opsional)" />
    </MdField>

    <MdField label="Catatan" for-id="ton-notes" full hint="Opsional, maksimal 500 karakter." :error="errors.notes">
      <textarea id="ton-notes" v-model.trim="form.notes" class="md-input" :class="{ 'is-invalid': errors.notes }" rows="3" maxlength="500" placeholder="Catatan (opsional)" />
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
import { listTypeOfUnits } from '../model'
import { MdModal, MdField, MdDropdown, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  typeOfNeed: { type: Object, default: null },
  rows: { type: Array, default: () => [] }, // untuk cek nama ganda
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.typeOfNeed?.id))
// Tabel type_of_need tidak punya kolom status; satuan (unit_id) dari Type of Unit.
const emptyForm = () => ({ name: '', detail: '', notes: '', unit_id: null })
const form = ref(emptyForm())
const errors = ref({})

const units = ref([])
const unitsLoading = ref(false)
const unitsError = ref('')

async function loadUnits() {
  if (units.value.length) return
  unitsLoading.value = true
  unitsError.value = ''
  try {
    units.value = await listTypeOfUnits()
  } catch (err) {
    unitsError.value = err?.message || 'Gagal memuat satuan.'
  } finally {
    unitsLoading.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    const t = props.typeOfNeed
    form.value = t ? { name: t.name || '', detail: t.detail || '', notes: t.notes || '', unit_id: t.unit_id ?? null } : emptyForm()
    errors.value = {}
    loadUnits()
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  const f = form.value
  if (!f.name) errs.name = 'Nama wajib diisi.'
  else if (f.name.length > 100) errs.name = 'Nama maksimal 100 karakter.'
  else if (props.rows.some((r) => r.id !== props.typeOfNeed?.id && String(r.name || '').toLowerCase() === f.name.toLowerCase())) errs.name = `Jenis kebutuhan ${f.name} sudah ada.`
  if (f.detail && f.detail.length > 500) errs.detail = 'Keterangan maksimal 500 karakter.'
  if (f.notes && f.notes.length > 500) errs.notes = 'Catatan maksimal 500 karakter.'
  if (!f.unit_id) errs.unit_id = 'Satuan wajib diisi.'
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  const f = form.value
  emit('submit', { name: f.name, detail: f.detail || null, notes: f.notes || null, unit_id: f.unit_id })
}

function onCancel() {
  emit('cancel')
}
</script>
