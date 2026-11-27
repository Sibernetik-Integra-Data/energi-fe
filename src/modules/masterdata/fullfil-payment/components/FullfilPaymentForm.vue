<template>
  <MdModal
    :open="visible"
    :title="isEdit ? `Ubah Pembayaran ${item.name || ''}`.trim() : 'Tambah Pembayaran Kebutuhan'"
    subtitle="Lengkapi data pembayaran. Kolom bertanda * wajib diisi."
    as-form
    @close="emit('cancel')"
    @submit="submit">
    <MdField label="Pemetaan kebutuhan" for-id="fy-map" required full :error="errors.fullfil_id">
      <MdDropdown id="fy-map" v-model="form.fullfil_id" field :invalid="!!errors.fullfil_id" placeholder="Pilih pemetaan kebutuhan"
        :options="mappings.map((m) => ({ value: String(m.id), label: m.name || `#${m.id}` }))" />
    </MdField>

    <MdField label="Nama" for-id="fy-name" required full :error="errors.name">
      <input id="fy-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="50" placeholder="Nama pembayaran" autocomplete="off" />
    </MdField>

    <MdField label="Nilai" for-id="fy-value" required :error="errors.value">
      <input id="fy-value" v-model="form.value" class="md-input" :class="{ 'is-invalid': errors.value }" type="number" step="1" placeholder="Nilai" />
    </MdField>

    <MdField label="Satuan" for-id="fy-unit" required :error="errors.unit_id">
      <MdDropdown id="fy-unit" v-model="form.unit_id" field :invalid="!!errors.unit_id" placeholder="Pilih satuan"
        :options="units.map((u) => ({ value: String(u.id), label: u.name || `#${u.id}` }))" />
    </MdField>

    <MdField label="Catatan" for-id="fy-notes" full hint="Opsional.">
      <textarea id="fy-notes" v-model.trim="form.notes" class="md-input" rows="3" maxlength="500" placeholder="Catatan (opsional)" style="resize: none" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="emit('cancel')">Batal</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? 'Menyimpan…' : (isEdit ? 'Simpan Perubahan' : 'Tambah Pembayaran') }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { MdModal, MdField, MdDropdown, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({ visible: Boolean, item: Object, mappings: { type: Array, default: () => [] }, units: { type: Array, default: () => [] }, submitting: Boolean, error: { type: String, default: '' } })
const emit = defineEmits(['submit', 'cancel'])
const isEdit = computed(() => Boolean(props.item?.id))
const form = reactive({ fullfil_id: '', name: '', value: '', unit_id: '', notes: '' })
const errors = reactive({ fullfil_id: '', name: '', value: '', unit_id: '' })

watch(() => props.visible, (visible) => {
  if (!visible) return
  Object.assign(form, props.item ? { fullfil_id: String(props.item.fullfil_id || ''), name: props.item.name || '', value: props.item.value ?? '', unit_id: String(props.item.unit_id || ''), notes: props.item.notes || '' } : { fullfil_id: '', name: '', value: '', unit_id: '', notes: '' })
  Object.keys(errors).forEach((key) => { errors[key] = '' })
}, { immediate: true })

function submit() {
  errors.fullfil_id = form.fullfil_id ? '' : 'Pemetaan Kebutuhan wajib diisi.'
  errors.name = form.name ? '' : 'Nama wajib diisi.'
  errors.value = form.value !== '' && form.value !== null ? '' : 'Nilai wajib diisi.'
  errors.unit_id = form.unit_id ? '' : 'Satuan wajib diisi.'
  if (Object.values(errors).some(Boolean)) return
  emit('submit', { fullfil_id: Number(form.fullfil_id), name: form.name, value: Number(form.value), unit_id: Number(form.unit_id), notes: form.notes || null })
}
</script>
