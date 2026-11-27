<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="onCancel">
      <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Ubah TPH' : 'Tambah TPH' }}</h3>
          <button type="button" class="border-0 bg-transparent cursor-pointer text-(--text-soft) hover:text-(--text) text-xl leading-none" aria-label="Tutup" @click="onCancel">&times;</button>
        </div>

        <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
          <!-- Petak -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="tph-petak">Petak <span class="text-red-500">*</span></label>
            <select id="tph-petak" v-model="form.id_block" :disabled="petakLoading" :class="fieldClass('id_block')">
              <option :value="null">{{ petakLoading ? 'Memuat…' : 'Pilih petak' }}</option>
              <option v-for="p in petakOptions" :key="p.id" :value="p.id">
                {{ p.name }}{{ p.block_group ? ` · Blok ${p.block_group}` : '' }}
              </option>
            </select>
            <span v-if="errors.id_block" class="text-xs text-red-500">{{ errors.id_block }}</span>
            <span v-else-if="petakError" class="text-xs text-red-500">{{ petakError }}</span>
            <span v-else class="text-xs text-(--text-soft)">Sumber: Data Master → Nomor Petak</span>
          </div>

          <div class="grid grid-cols-3 gap-4 max-[520px]:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="tph-type">Jenis <span class="text-red-500">*</span></label>
              <select id="tph-type" v-model="form.tph_type" :class="fieldClass('tph_type')">
                <option value="">Pilih</option>
                <option value="PERAWATAN">Perawatan</option>
                <option value="PANEN">Panen</option>
              </select>
              <span v-if="errors.tph_type" class="text-xs text-red-500">{{ errors.tph_type }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="tph-side">Sisi <span class="text-red-500">*</span></label>
              <select id="tph-side" v-model="form.side" :class="fieldClass('side')">
                <option value="">Pilih</option>
                <option value="U">U (utara)</option>
                <option value="S">S (selatan)</option>
                <option value="US">US (utara-selatan)</option>
              </select>
              <span v-if="errors.side" class="text-xs text-red-500">{{ errors.side }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="tph-line">Nomor Jalur <span class="text-red-500">*</span></label>
              <input id="tph-line" v-model.number="form.line_no" type="number" min="1" max="99" step="1" placeholder="1–99" :class="fieldClass('line_no')" />
              <span v-if="errors.line_no" class="text-xs text-red-500">{{ errors.line_no }}</span>
            </div>
          </div>

          <div class="text-xs text-(--text-muted) -mt-2">
            Kode TPH: <strong class="text-(--text)">{{ code || '—' }}</strong> (otomatis dari sisi + nomor jalur)
          </div>

          <div class="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="tph-trees">Jumlah Pohon</label>
              <input id="tph-trees" v-model.number="form.tree_count" type="number" min="0" step="1" placeholder="mis. 40" :class="fieldClass('tree_count')" />
              <span v-if="errors.tree_count" class="text-xs text-red-500">{{ errors.tree_count }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <span class="text-sm font-semibold text-(--text)">Status</span>
              <label class="flex items-center gap-2 text-sm text-(--text) py-2.5 cursor-pointer">
                <input v-model="form.is_active" type="checkbox" class="w-4 h-4 accent-green-600" />
                Aktif
              </label>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="tph-lat">Latitude</label>
              <input id="tph-lat" v-model.trim="form.latitude" type="text" inputmode="decimal" placeholder="mis. -0.5123" :class="fieldClass('latitude')" />
              <span v-if="errors.latitude" class="text-xs text-red-500">{{ errors.latitude }}</span>
            </div>
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="tph-lng">Longitude</label>
              <input id="tph-lng" v-model.trim="form.longitude" type="text" inputmode="decimal" placeholder="mis. 117.1234" :class="fieldClass('longitude')" />
              <span v-if="errors.longitude" class="text-xs text-red-500">{{ errors.longitude }}</span>
            </div>
          </div>

          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="tph-notes">Catatan</label>
            <textarea id="tph-notes" v-model.trim="form.notes" rows="2" placeholder="Opsional"
              class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500 resize-none" />
          </div>

          <div v-if="error" class="text-xs text-red-500">{{ error }}</div>

          <div class="flex justify-end gap-3 pt-1">
            <button type="button" class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted)" :disabled="submitting" @click="onCancel">Batal</button>
            <button type="submit" class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-green-700 disabled:opacity-60" :disabled="submitting">
              <span v-if="submitting">Menyimpan&hellip;</span>
              <span v-else>{{ isEdit ? 'Simpan Perubahan' : 'Tambah TPH' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { listPetakOptions } from '../model'

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

const fieldClass = (key) => [
  'border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors',
  errors.value[key] ? 'border-red-400 bg-red-50' : 'border-(--border) bg-(--surface-muted) focus:border-green-500'
]

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
