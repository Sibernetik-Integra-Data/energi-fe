<template>
  <MdModal
    :open="visible"
    :title="isEdit ? `Ubah Tujuan ${location.name || ''}`.trim() : 'Tambah Tujuan'"
    subtitle="Lengkapi data tujuan. Kolom bertanda * wajib diisi."
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField label="Nama" for-id="loc-name" required :error="errors.name">
      <input id="loc-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" type="text" placeholder="mis. PKS Utara" autocomplete="off" />
    </MdField>

    <MdField label="Tipe tujuan" for-id="loc-type" required :hint="typeLoadError" :error="errors.tol_id">
      <MdDropdown
        id="loc-type"
        v-model="form.tol_id"
        field
        :invalid="!!errors.tol_id"
        :disabled="typeOfLocationsLoading"
        :placeholder="typeOfLocationsLoading ? 'Memuat tipe…' : 'Pilih tipe tujuan'"
        :options="typeOfLocations.map((t) => ({ value: String(t.id), label: t.name }))" />
    </MdField>

    <MdField label="Tujuan" for-id="loc-location" full hint="Opsional.">
      <input id="loc-location" v-model.trim="form.location" class="md-input" type="text" placeholder="mis. Pabrik Utara" autocomplete="off" />
    </MdField>

    <MdField label="Latitude" for-id="loc-lat" hint="Opsional.">
      <input id="loc-lat" v-model.trim="form.latitude" class="md-input" type="text" inputmode="decimal" placeholder="mis. -1.234567" autocomplete="off" />
    </MdField>

    <MdField label="Longitude" for-id="loc-lng" hint="Opsional.">
      <input id="loc-lng" v-model.trim="form.longitude" class="md-input" type="text" inputmode="decimal" placeholder="mis. 103.123456" autocomplete="off" />
    </MdField>

    <MdField label="Catatan" for-id="loc-notes" full>
      <textarea id="loc-notes" v-model.trim="form.notes" class="md-input" rows="2" placeholder="Catatan tambahan" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">Batal</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Tujuan' }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { listTypeOfLocations } from '../model'
import { MdModal, MdField, MdDropdown, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  location: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.location?.id))

const emptyForm = () => ({ name: '', location: '', tol_id: '', latitude: '', longitude: '', notes: '' })
const form = ref(emptyForm())
const errors = ref({})

const typeOfLocations = ref([])
const typeOfLocationsLoading = ref(false)
const typeLoadError = ref('')

async function loadTypeOfLocations() {
  typeOfLocationsLoading.value = true
  typeLoadError.value = ''
  try {
    typeOfLocations.value = await listTypeOfLocations()
  } catch (err) {
    console.error('[DestinationForm] Failed to load type_of_location:', err)
    typeLoadError.value = err?.message || 'Gagal memuat tipe tujuan.'
  } finally {
    typeOfLocationsLoading.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    errors.value = {}
    const l = props.location
    form.value = l
      ? {
          name: l.name || '',
          location: l.location || '',
          tol_id: String(l.tol_id ?? l.location_type?.id ?? ''),
          latitude: l.latitude || '',
          longitude: l.longitude || '',
          notes: l.notes || ''
        }
      : emptyForm()
    if (typeOfLocations.value.length === 0) loadTypeOfLocations()
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  if (!form.value.name) errs.name = 'Nama wajib diisi.'
  // The database requires a type; without this check the server answered 500.
  if (!form.value.tol_id) errs.tol_id = 'Pilih tipe tujuan.'
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  const payload = {
    name: form.value.name,
    location: form.value.location,
    tol_id: Number(form.value.tol_id),
    latitude: form.value.latitude,
    longitude: form.value.longitude,
    notes: form.value.notes
  }
  const cleaned = Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined && v !== ''))
  emit('submit', cleaned)
}

function onCancel() {
  emit('cancel')
}
</script>
