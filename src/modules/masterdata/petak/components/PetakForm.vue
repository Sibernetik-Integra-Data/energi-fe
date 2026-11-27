<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="onCancel">
      <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Ubah Petak' : 'Tambah Petak' }}</h3>
          <button type="button" class="border-0 bg-transparent cursor-pointer text-(--text-soft) hover:text-(--text) text-xl leading-none" aria-label="Tutup" @click="onCancel">&times;</button>
        </div>

        <form class="flex flex-col gap-4" novalidate @submit.prevent="onSubmit">
          <!-- Nomor petak -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="petak-name">Nomor Petak <span class="text-red-500">*</span></label>
            <input id="petak-name" v-model.trim="form.name" type="text" maxlength="20" placeholder="mis. 113a" autocomplete="off"
              class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
              :class="errors.name ? 'border-red-400 bg-red-50' : 'border-(--border) bg-(--surface-muted) focus:border-green-500'"
              @blur="suggestBlok" />
            <span v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</span>
          </div>

          <!-- Blok -->
          <div class="flex flex-col gap-1">
            <label class="text-sm font-semibold text-(--text)" for="petak-blok">Blok <span class="text-red-500">*</span></label>
            <select id="petak-blok" v-model="form.id_block_group" :disabled="bloksLoading"
              class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
              :class="errors.id_block_group ? 'border-red-400 bg-red-50' : 'border-(--border) bg-(--surface-muted) focus:border-green-500'">
              <option :value="null">{{ bloksLoading ? 'Memuat…' : 'Pilih blok' }}</option>
              <option v-for="b in bloks" :key="b.id" :value="b.id">Blok {{ b.name }}</option>
            </select>
            <span v-if="errors.id_block_group" class="text-xs text-red-500">{{ errors.id_block_group }}</span>
            <span v-else-if="blokError" class="text-xs text-red-500">{{ blokError }}</span>
            <span v-else class="text-xs text-(--text-soft)">Sumber: Data Master → Blok. Dipilih otomatis dari angka awal nomor petak.</span>
          </div>

          <div class="grid grid-cols-2 gap-4 max-[520px]:grid-cols-1">
            <!-- Status tanam -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="petak-status">Status Tanam</label>
              <select id="petak-status" v-model="form.planting_status"
                class="border border-(--border) rounded-lg px-3.5 py-2.5 text-sm text-(--text) bg-(--surface-muted) outline-none focus:border-green-500">
                <option value="">— Belum diisi —</option>
                <option value="TBM">TBM (belum menghasilkan)</option>
                <option value="TM">TM (menghasilkan)</option>
              </select>
              <span class="text-xs text-(--text-soft)">Otomatis TM bila ada TPH panen aktif.</span>
            </div>

            <!-- Tahun tanam -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="petak-year">Tahun Tanam</label>
              <input id="petak-year" v-model.number="form.planting_year" type="number" min="1950" :max="maxYear" step="1" placeholder="mis. 2015"
                class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                :class="errors.planting_year ? 'border-red-400 bg-red-50' : 'border-(--border) bg-(--surface-muted) focus:border-green-500'" />
              <span v-if="errors.planting_year" class="text-xs text-red-500">{{ errors.planting_year }}</span>
            </div>

            <!-- Jumlah pohon -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="petak-plants">Jumlah Pohon</label>
              <input id="petak-plants" v-model.number="form.plants_count" type="number" min="0" step="1" placeholder="mis. 1500"
                class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                :class="errors.plants_count ? 'border-red-400 bg-red-50' : 'border-(--border) bg-(--surface-muted) focus:border-green-500'" />
              <span v-if="errors.plants_count" class="text-xs text-red-500">{{ errors.plants_count }}</span>
            </div>

            <!-- Luas -->
            <div class="flex flex-col gap-1">
              <label class="text-sm font-semibold text-(--text)" for="petak-wide">Luas (ha)</label>
              <input id="petak-wide" v-model.number="form.wide" type="number" min="0" step="0.01" placeholder="mis. 12.5"
                class="border rounded-lg px-3.5 py-2.5 text-sm text-(--text) outline-none transition-colors"
                :class="errors.wide ? 'border-red-400 bg-red-50' : 'border-(--border) bg-(--surface-muted) focus:border-green-500'" />
              <span v-if="errors.wide" class="text-xs text-red-500">{{ errors.wide }}</span>
            </div>
          </div>

          <div v-if="error" class="text-xs text-red-500">{{ error }}</div>

          <div class="flex justify-end gap-3 pt-1">
            <button type="button" class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-(--surface-muted)" :disabled="submitting" @click="onCancel">Batal</button>
            <button type="submit" class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg cursor-pointer hover:bg-green-700 disabled:opacity-60" :disabled="submitting">
              <span v-if="submitting">Menyimpan&hellip;</span>
              <span v-else>{{ isEdit ? 'Simpan Perubahan' : 'Tambah Petak' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { listBlok } from '../model'

const props = defineProps({
  visible: { type: Boolean, default: false },
  petak: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])

const isEdit = computed(() => Boolean(props.petak?.id))
const maxYear = new Date().getFullYear()

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
    bloks.value = await listBlok()
  } catch (err) {
    blokError.value = err?.message || 'Gagal memuat blok.'
  } finally {
    bloksLoading.value = false
  }
}

// "113a" -> Blok 113, hanya bila Blok belum dipilih.
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
  if (!f.id_block_group) e.id_block_group = 'Pilih blok.'
  if (!isBlank(f.planting_year) && (!Number.isInteger(f.planting_year) || f.planting_year < 1950 || f.planting_year > maxYear)) {
    e.planting_year = `Tahun 1950–${maxYear}.`
  }
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
