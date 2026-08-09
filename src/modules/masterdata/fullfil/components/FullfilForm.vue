<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="emit('cancel')">
      <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between"><h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Edit Fullfil' : 'Add Fullfil' }}</h3><button type="button" class="border-0 bg-transparent text-(--text-soft) text-xl cursor-pointer" @click="emit('cancel')">&times;</button></div>
        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Type of Work <span class="text-red-500">*</span>
            <select v-model="form.tow_id" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted)" :class="{ 'border-red-400': errors.tow_id }"><option value="">Select type of work</option><option v-for="item in typeOfWorks" :key="item.id" :value="String(item.id)">{{ item.name || `#${item.id}` }}</option></select><span v-if="errors.tow_id" class="text-xs text-red-500">{{ errors.tow_id }}</span>
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Type of Need <span class="text-red-500">*</span>
            <select v-model="form.ton_id" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted)" :class="{ 'border-red-400': errors.ton_id }"><option value="">Select type of need</option><option v-for="item in typeOfNeeds" :key="item.id" :value="String(item.id)">{{ item.name || `#${item.id}` }}</option></select><span v-if="errors.ton_id" class="text-xs text-red-500">{{ errors.ton_id }}</span>
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Access
            <select v-model="form.access" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted)"><option value="">Select access</option><option value="admin">Admin</option><option value="pekerja">Pekerja</option></select>
          </label>
          <label class="flex flex-col gap-1 text-sm font-semibold text-(--text)">Notes<textarea v-model.trim="form.notes" rows="3" maxlength="500" class="border border-(--border) rounded-lg px-3.5 py-2.5 font-normal bg-(--surface-muted) resize-none" /></label>
          <label class="flex items-center gap-2 text-sm font-semibold text-(--text)"><input v-model="form.is_view" type="checkbox" class="accent-green-600" /> Visible</label>
          <div class="flex justify-end gap-3"><button type="button" class="border border-(--border) bg-(--surface) text-(--text) font-semibold text-sm py-2.5 px-5 rounded-lg" :disabled="submitting" @click="emit('cancel')">Cancel</button><button type="submit" class="border-0 bg-green-600 text-white font-semibold text-sm py-2.5 px-5 rounded-lg disabled:opacity-60" :disabled="submitting">{{ submitting ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Fullfil') }}</button></div>
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
const form = reactive({ tow_id: '', ton_id: '', access: '', notes: '', is_view: true })
const errors = reactive({ tow_id: '', ton_id: '' })

watch(() => props.visible, (visible) => {
  if (!visible) return
  Object.assign(form, props.fullfil ? { tow_id: String(props.fullfil.tow_id || ''), ton_id: String(props.fullfil.ton_id || ''), access: props.fullfil.access || '', notes: props.fullfil.notes || '', is_view: props.fullfil.is_view !== 0 } : { tow_id: '', ton_id: '', access: '', notes: '', is_view: true })
  errors.tow_id = ''; errors.ton_id = ''
})

function submit() {
  errors.tow_id = form.tow_id ? '' : 'Type of Work is required.'
  errors.ton_id = form.ton_id ? '' : 'Type of Need is required.'
  if (errors.tow_id || errors.ton_id) return
  emit('submit', { tow_id: Number(form.tow_id), ton_id: Number(form.ton_id), access: form.access || null, notes: form.notes || null, is_view: form.is_view ? 1 : 0 })
}
</script>
