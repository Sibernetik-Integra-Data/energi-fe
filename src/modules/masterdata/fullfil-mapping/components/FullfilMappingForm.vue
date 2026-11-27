<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="emit('cancel')">
      <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between"><h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Ubah Pemetaan Kebutuhan' : 'Tambah Pemetaan Kebutuhan' }}</h3><button type="button" class="border-0 bg-transparent text-(--text-soft) text-xl cursor-pointer" @click="emit('cancel')">&times;</button></div>
        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Nama <span class="text-red-500">*</span>
            <input v-model.trim="form.name" type="text" maxlength="50" placeholder="mis. Panen - Hitung TBS" autocomplete="off" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted)" :class="{ 'border-red-400': errors.name }" /><span v-if="errors.name" class="text-xs text-red-500">{{ errors.name }}</span>
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Judul
            <input v-model.trim="form.title" type="text" maxlength="100" placeholder="mis. Perhitungan panen TBS" autocomplete="off" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted)" />
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Jenis Pekerjaan <span class="text-red-500">*</span>
            <select v-model="form.tow_id" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted)" :class="{ 'border-red-400': errors.tow_id }"><option value="">Pilih jenis pekerjaan</option><option v-for="item in typeOfWorks" :key="item.id" :value="String(item.id)">{{ item.name || `#${item.id}` }}</option></select><span v-if="errors.tow_id" class="text-xs text-red-500">{{ errors.tow_id }}</span>
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Jenis Kebutuhan <span class="text-red-500">*</span>
            <select v-model="form.ton_id" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted)" :class="{ 'border-red-400': errors.ton_id }"><option value="">Pilih jenis kebutuhan</option><option v-for="item in typeOfNeeds" :key="item.id" :value="String(item.id)">{{ item.name || `#${item.id}` }}</option></select><span v-if="errors.ton_id" class="text-xs text-red-500">{{ errors.ton_id }}</span>
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Akses
            <select v-model="form.access" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted)"><option value="">Pilih akses</option><option value="admin">Admin</option><option value="pekerja">Pekerja</option></select>
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Catatan<textarea v-model.trim="form.notes" rows="3" maxlength="500" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted) resize-none" /></label>
          <label class="flex items-center gap-2 text-sm font-semibold text-(--text)"><input v-model="form.is_view" type="checkbox" class="accent-green-600" /> Tampil</label>
          <div class="flex justify-end gap-3"><button type="button" class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg" :disabled="submitting" @click="emit('cancel')">Batal</button><button type="submit" class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg disabled:opacity-60" :disabled="submitting">{{ submitting ? 'Menyimpan…' : (isEdit ? 'Simpan Perubahan' : 'Tambah Pemetaan Kebutuhan') }}</button></div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({ visible: Boolean, fullfil: Object, typeOfWorks: { type: Array, default: () => [] }, typeOfNeeds: { type: Array, default: () => [] }, submitting: Boolean })
const emit = defineEmits(['submit', 'cancel'])
const isEdit = computed(() => Boolean(props.fullfil?.id))
const form = reactive({ name: '', title: '', tow_id: '', ton_id: '', access: '', notes: '', is_view: true })
const errors = reactive({ name: '', tow_id: '', ton_id: '' })

watch(() => props.visible, (visible) => {
  if (!visible) return
  Object.assign(form, props.fullfil ? { name: props.fullfil.name || '', title: props.fullfil.title || '', tow_id: String(props.fullfil.tow_id || ''), ton_id: String(props.fullfil.ton_id || ''), access: props.fullfil.access || '', notes: props.fullfil.notes || '', is_view: props.fullfil.is_view !== 0 } : { name: '', title: '', tow_id: '', ton_id: '', access: '', notes: '', is_view: true })
  errors.name = ''; errors.tow_id = ''; errors.ton_id = ''
})

function submit() {
  // name is required by the database; the form used to have no field for it.
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
