<template>
  <MdModal
    :open="visible"
    :title="isEdit ? `Ubah Petak ${petak.name}` : 'Tambah Petak'"
    subtitle="Lengkapi data petak. Kolom bertanda * wajib diisi."
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField label="Nomor petak" for-id="petak-name" required hint="Huruf di akhir menandai bagian blok, mis. 113a." :error="errors.name">
      <input id="petak-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="20" placeholder="mis. 113a" autocomplete="off" @blur="suggestBlok" />
    </MdField>

    <MdField label="Blok" for-id="petak-blok" required :hint="blokError || 'Dipilih otomatis dari angka awal nomor petak.'" :error="errors.id_block_group">
      <MdDropdown
        id="petak-blok"
        v-model="form.id_block_group"
        field
        :invalid="!!errors.id_block_group"
        :disabled="bloksLoading"
        :placeholder="bloksLoading ? 'Memuat…' : 'Pilih blok'"
        :options="bloks.map((b) => ({ value: b.id, label: `Blok ${b.name}` }))" />
    </MdField>

    <MdField label="Status tanam" full hint="Otomatis TM bila petak punya TPH panen aktif.">
      <MdSegmented v-model="form.planting_status" aria-label="Status tanam" :options="statusOptions" />
    </MdField>

    <MdField label="Tahun tanam" for-id="petak-year" :hint="`1950 sampai ${maxYear}.`" :error="errors.planting_year">
      <input id="petak-year" v-model.number="form.planting_year" class="md-input" :class="{ 'is-invalid': errors.planting_year }" type="number" min="1950" :max="maxYear" step="1" placeholder="mis. 2015" />
    </MdField>

    <MdField label="Luas (ha)" for-id="petak-wide" hint="Opsional." :error="errors.wide">
      <input id="petak-wide" v-model.number="form.wide" class="md-input" :class="{ 'is-invalid': errors.wide }" type="number" min="0" step="0.01" placeholder="mis. 12,5" />
    </MdField>

    <MdField label="Jumlah pohon" for-id="petak-plants" hint="Opsional." :error="errors.plants_count" full>
      <input id="petak-plants" v-model.number="form.plants_count" class="md-input" :class="{ 'is-invalid': errors.plants_count }" type="number" min="0" step="1" placeholder="mis. 1500" />
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
import { listBlok } from '../model'
import { MdModal, MdField, MdDropdown, MdSegmented, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  petak: { type: Object, default: null },
  rows: { type: Array, default: () => [] }, // untuk cek nomor petak ganda
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.petak?.id))
const maxYear = new Date().getFullYear()
const statusOptions = [
  { value: '', label: 'Belum diisi' },
  { value: 'TBM', label: 'TBM' },
  { value: 'TM', label: 'TM' }
]

const emptyForm = () => ({ name: '', id_block_group: null, planting_status: '', planting_year: null, plants_count: null, wide: null })
const form = ref(emptyForm())
const errors = ref({})

const bloks = ref([])
const bloksLoading = ref(false)
const blokError = ref('')

async function loadBloks() {
  if (bloks.value.length) return
  bloksLoading.value = true
  blokError.value = ''
  try {
    const list = await listBlok()
    bloks.value = list.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'id', { numeric: true }))
  } catch (err) {
    blokError.value = err?.message || 'Gagal memuat blok.'
  } finally {
    bloksLoading.value = false
  }
}

// "113a" -> Blok 113, hanya bila blok belum dipilih.
function suggestBlok() {
  if (form.value.id_block_group) return
  const m = /^(\d+)/.exec(form.value.name || '')
  const hit = m && bloks.value.find((b) => String(b.name) === m[1])
  if (hit) form.value.id_block_group = hit.id
}

watch(
  () => [props.visible, props.petak],
  ([visible, p]) => {
    if (!visible) return
    errors.value = {}
    form.value = p
      ? {
          name: p.name || '',
          id_block_group: p.id_block_group ?? null,
          // Nilai yang disimpan, bukan hasil hitung (TM otomatis dari TPH panen).
          planting_status: p.planting_status_manual || '',
          planting_year: p.planting_year ?? null,
          plants_count: p.plants_count ?? null,
          wide: p.wide == null ? null : Number(p.wide)
        }
      : emptyForm()
    loadBloks()
  },
  { immediate: true }
)

const isBlank = (v) => v === null || v === undefined || v === ''

function validate() {
  const e = {}
  const f = form.value
  if (!f.name) e.name = 'Nomor petak wajib diisi.'
  else if (props.rows.some((r) => r.id !== props.petak?.id && String(r.name).toLowerCase() === f.name.toLowerCase())) e.name = `Petak ${f.name} sudah ada.`
  if (!f.id_block_group) e.id_block_group = 'Pilih blok.'
  if (!isBlank(f.planting_year) && (!Number.isInteger(f.planting_year) || f.planting_year < 1950 || f.planting_year > maxYear)) e.planting_year = `Tahun harus 1950–${maxYear}.`
  if (!isBlank(f.plants_count) && (!Number.isInteger(f.plants_count) || f.plants_count < 0)) e.plants_count = 'Bilangan bulat ≥ 0.'
  if (!isBlank(f.wide) && !(Number(f.wide) >= 0)) e.wide = 'Angka ≥ 0.'
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  const f = form.value
  emit('submit', {
    name: f.name,
    id_block_group: f.id_block_group,
    planting_status: f.planting_status || null,
    planting_year: isBlank(f.planting_year) ? null : f.planting_year,
    plants_count: isBlank(f.plants_count) ? null : f.plants_count,
    wide: isBlank(f.wide) ? null : Number(f.wide)
  })
}

function onCancel() {
  emit('cancel')
}
</script>
