<template>
  <MdModal
    :open="visible"
    :title="isEdit ? `Ubah TPH ${tph.code || tph.name || ''}` : 'Tambah TPH'"
    subtitle="Lengkapi data TPH. Kolom bertanda * wajib diisi."
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField label="Petak" for-id="tph-petak" required full :hint="petakError || 'Sumber: Data Master → Nomor Petak'" :error="errors.id_block">
      <MdDropdown
        id="tph-petak"
        v-model="form.id_block"
        field
        :invalid="!!errors.id_block"
        :disabled="petakLoading"
        :placeholder="petakLoading ? 'Memuat…' : 'Pilih petak'"
        :options="petakOptions.map((p) => ({ value: p.id, label: `${p.name}${p.block_group ? ` · Blok ${p.block_group}` : ''}` }))" />
    </MdField>

    <MdField label="Jenis" required full :error="errors.tph_type">
      <MdSegmented v-model="form.tph_type" aria-label="Jenis TPH" :options="typeOptions" />
    </MdField>

    <MdField label="Sisi" required full :error="errors.side">
      <MdSegmented v-model="form.side" aria-label="Sisi" :options="sideOptions" />
    </MdField>

    <MdField label="Nomor jalur" for-id="tph-line" required :hint="`Kode TPH: ${code || '—'} (otomatis dari sisi + nomor jalur)`" :error="errors.line_no">
      <input id="tph-line" v-model.number="form.line_no" class="md-input" :class="{ 'is-invalid': errors.line_no }" type="number" min="1" max="99" step="1" placeholder="1–99" />
    </MdField>

    <MdField label="Jumlah pohon" for-id="tph-trees" hint="Opsional." :error="errors.tree_count">
      <input id="tph-trees" v-model.number="form.tree_count" class="md-input" :class="{ 'is-invalid': errors.tree_count }" type="number" min="0" step="1" placeholder="mis. 40" />
    </MdField>

    <MdField label="Latitude" for-id="tph-lat" :error="errors.latitude">
      <input id="tph-lat" v-model.trim="form.latitude" class="md-input" :class="{ 'is-invalid': errors.latitude }" inputmode="decimal" placeholder="mis. -0.5123" />
    </MdField>

    <MdField label="Longitude" for-id="tph-lng" :error="errors.longitude">
      <input id="tph-lng" v-model.trim="form.longitude" class="md-input" :class="{ 'is-invalid': errors.longitude }" inputmode="decimal" placeholder="mis. 117.1234" />
    </MdField>

    <MdField label="Catatan" for-id="tph-notes" full hint="Opsional.">
      <textarea id="tph-notes" v-model.trim="form.notes" class="md-input" rows="2" placeholder="Opsional" style="resize: vertical; height: auto" />
    </MdField>

    <MdField full>
      <MdSwitch v-model="form.is_active" label="Aktif" description="TPH nonaktif tidak dipakai di sensus dan penugasan baru." />
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
import { listPetakOptions } from '../model'
import { MdModal, MdField, MdDropdown, MdSegmented, MdSwitch, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  tph: { type: Object, default: null },
  // Petak terpilih di filter daftar, dipakai sebagai bawaan saat menambah.
  defaultPetakId: { type: Number, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.tph?.id))
const typeOptions = [
  { value: 'PERAWATAN', label: 'Perawatan' },
  { value: 'PANEN', label: 'Panen' }
]
const sideOptions = [
  { value: 'U', label: 'U (utara)' },
  { value: 'S', label: 'S (selatan)' },
  { value: 'US', label: 'US (utara-selatan)' }
]

const emptyForm = () => ({
  id_block: props.defaultPetakId ?? null, tph_type: '', side: '', line_no: null,
  tree_count: null, is_active: true, latitude: '', longitude: '', notes: ''
})
const form = ref(emptyForm())
const errors = ref({})

const petakOptions = ref([])
const petakLoading = ref(false)
const petakError = ref('')

async function loadPetak() {
  if (petakOptions.value.length) return
  petakLoading.value = true
  petakError.value = ''
  try {
    const rows = await listPetakOptions()
    petakOptions.value = rows.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'id', { numeric: true }))
  } catch (err) {
    petakError.value = err?.message || 'Gagal memuat petak.'
  } finally {
    petakLoading.value = false
  }
}

const code = computed(() =>
  form.value.side && Number.isInteger(form.value.line_no) ? `${form.value.side}${String(form.value.line_no).padStart(2, '0')}` : ''
)

watch(
  () => [props.visible, props.tph],
  ([visible, t]) => {
    if (!visible) return
    errors.value = {}
    form.value = t
      ? {
          id_block: t.id_block ?? null,
          tph_type: t.tph_type || '',
          side: t.side || '',
          line_no: t.line_no ?? null,
          tree_count: t.tree_count ?? null,
          is_active: t.is_active !== false,
          latitude: t.latitude || '',
          longitude: t.longitude || '',
          notes: t.notes || ''
        }
      : emptyForm()
    loadPetak()
  },
  { immediate: true }
)

const isBlank = (v) => v === null || v === undefined || v === ''

function validate() {
  const f = form.value
  const e = {}
  if (!f.id_block) e.id_block = 'Pilih petak.'
  if (!f.tph_type) e.tph_type = 'Pilih jenis.'
  if (!f.side) e.side = 'Pilih sisi.'
  if (!Number.isInteger(f.line_no) || f.line_no < 1 || f.line_no > 99) e.line_no = '1–99.'
  if (!isBlank(f.tree_count) && (!Number.isInteger(f.tree_count) || f.tree_count < 0)) e.tree_count = 'Bilangan bulat ≥ 0.'
  if (f.latitude && !(Number(f.latitude) >= -90 && Number(f.latitude) <= 90)) e.latitude = 'Angka -90 s.d. 90.'
  if (f.longitude && !(Number(f.longitude) >= -180 && Number(f.longitude) <= 180)) e.longitude = 'Angka -180 s.d. 180.'
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  const f = form.value
  emit('submit', {
    id_block: f.id_block,
    tph_type: f.tph_type,
    side: f.side,
    line_no: f.line_no,
    tree_count: isBlank(f.tree_count) ? null : f.tree_count,
    is_active: !!f.is_active,
    latitude: f.latitude || null,
    longitude: f.longitude || null,
    notes: f.notes || null
  })
}

function onCancel() {
  emit('cancel')
}
</script>
