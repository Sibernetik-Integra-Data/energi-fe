<template>
  <MdModal
    :open="visible"
    :title="isEdit ? `Ubah Pemetaan ${fullfil.name || ''}`.trim() : 'Tambah Pemetaan Kebutuhan'"
    subtitle="Hubungkan jenis pekerjaan dengan jenis kebutuhan. Kolom bertanda * wajib diisi."
    as-form
    @close="emit('cancel')"
    @submit="submit">
    <MdField label="Nama" for-id="fm-name" required :error="errors.name">
      <input id="fm-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" type="text" maxlength="50" placeholder="mis. Panen - Hitung TBS" autocomplete="off" />
    </MdField>

    <MdField label="Judul" for-id="fm-title" hint="Opsional.">
      <input id="fm-title" v-model.trim="form.title" class="md-input" type="text" maxlength="100" placeholder="mis. Perhitungan panen TBS" autocomplete="off" />
    </MdField>

    <MdField label="Jenis pekerjaan" for-id="fm-tow" required :error="errors.tow_id">
      <MdDropdown id="fm-tow" v-model="form.tow_id" field :invalid="!!errors.tow_id" placeholder="Pilih jenis pekerjaan"
        :options="typeOfWorks.map((item) => ({ value: String(item.id), label: item.name || `#${item.id}` }))" />
    </MdField>

    <MdField label="Jenis kebutuhan" for-id="fm-ton" required :error="errors.ton_id">
      <MdDropdown id="fm-ton" v-model="form.ton_id" field :invalid="!!errors.ton_id" placeholder="Pilih jenis kebutuhan"
        :options="typeOfNeeds.map((item) => ({ value: String(item.id), label: item.name || `#${item.id}` }))" />
    </MdField>

    <MdField label="Akses" full hint="Kosongkan agar memakai nilai bawaan server.">
      <MdSegmented v-model="form.access" aria-label="Akses" :options="accessOptions" />
    </MdField>

    <MdField label="Catatan" for-id="fm-notes" full hint="Opsional.">
      <textarea id="fm-notes" v-model.trim="form.notes" class="md-input" rows="3" maxlength="500" style="resize: none" />
    </MdField>

    <MdField full>
      <MdSwitch v-model="form.is_view" label="Tampil" description="Tampilkan pemetaan ini di aplikasi." />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="emit('cancel')">Batal</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? 'Menyimpan…' : (isEdit ? 'Simpan Perubahan' : 'Tambah Pemetaan') }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { MdModal, MdField, MdDropdown, MdSegmented, MdSwitch, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({ visible: Boolean, fullfil: Object, typeOfWorks: { type: Array, default: () => [] }, typeOfNeeds: { type: Array, default: () => [] }, submitting: Boolean, error: { type: String, default: '' } })
const emit = defineEmits(['submit', 'cancel'])
const isEdit = computed(() => Boolean(props.fullfil?.id))
const accessOptions = [{ value: '', label: 'Bawaan' }, { value: 'admin', label: 'Admin' }, { value: 'pekerja', label: 'Pekerja' }]
const form = reactive({ name: '', title: '', tow_id: '', ton_id: '', access: '', notes: '', is_view: true })
const errors = reactive({ name: '', tow_id: '', ton_id: '' })

watch(() => props.visible, (visible) => {
  if (!visible) return
  Object.assign(form, props.fullfil ? { name: props.fullfil.name || '', title: props.fullfil.title || '', tow_id: String(props.fullfil.tow_id || ''), ton_id: String(props.fullfil.ton_id || ''), access: props.fullfil.access || '', notes: props.fullfil.notes || '', is_view: props.fullfil.is_view !== 0 } : { name: '', title: '', tow_id: '', ton_id: '', access: '', notes: '', is_view: true })
  errors.name = ''; errors.tow_id = ''; errors.ton_id = ''
}, { immediate: true })

function submit() {
  // name is required by the database.
  errors.name = form.name ? '' : 'Nama wajib diisi.'
  errors.tow_id = form.tow_id ? '' : 'Jenis pekerjaan wajib diisi.'
  errors.ton_id = form.ton_id ? '' : 'Jenis Kebutuhan wajib diisi.'
  if (errors.name || errors.tow_id || errors.ton_id) return
  const payload = { name: form.name, title: form.title || null, tow_id: Number(form.tow_id), ton_id: Number(form.ton_id), notes: form.notes || null, is_view: form.is_view ? 1 : 0 }
  // access is NOT NULL in the table: leave it out when nothing is chosen so the default applies.
  if (form.access) payload.access = form.access
  emit('submit', payload)
}
</script>
