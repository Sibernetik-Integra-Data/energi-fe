<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @mousedown.self="emit('cancel')">
      <div class="bg-(--surface) rounded-2xl shadow-xl w-full max-w-lg mx-4 p-6 flex flex-col gap-5 max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between"><h3 class="text-lg font-bold text-(--text) m-0">{{ isEdit ? 'Edit Fullfil Payment' : 'Add Fullfil Payment' }}</h3><button type="button" class="border-0 bg-transparent text-(--text-soft) text-xl cursor-pointer" @click="emit('cancel')">&times;</button></div>
        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <label class="field">Fullfil Mapping ID (FK) <span class="required">*</span><select v-model="form.fullfil_id" :class="{ invalid: errors.fullfil_id }"><option value="">Select Fullfil Mapping ID</option><option v-for="item in mappings" :key="item.id" :value="String(item.id)">ID {{ item.id }}</option></select><span v-if="errors.fullfil_id" class="error">{{ errors.fullfil_id }}</span></label>
          <label class="field">Name <span class="required">*</span><input v-model.trim="form.name" maxlength="50" placeholder="Payment name" :class="{ invalid: errors.name }" /><span v-if="errors.name" class="error">{{ errors.name }}</span></label>
          <label class="field">Value <span class="required">*</span><input v-model="form.value" type="number" step="1" placeholder="Value" :class="{ invalid: errors.value }" /><span v-if="errors.value" class="error">{{ errors.value }}</span></label>
          <label class="field">Type of Unit <span class="required">*</span><select v-model="form.unit_id" :class="{ invalid: errors.unit_id }"><option value="">Select type of unit</option><option v-for="item in units" :key="item.id" :value="String(item.id)">{{ item.name || `#${item.id}` }}</option></select><span v-if="errors.unit_id" class="error">{{ errors.unit_id }}</span></label>
          <label class="field">Notes<textarea v-model.trim="form.notes" rows="3" maxlength="500" placeholder="Optional notes" /></label>
          <div class="flex justify-end gap-3"><button type="button" class="button secondary" :disabled="submitting" @click="emit('cancel')">Cancel</button><button type="submit" class="button primary" :disabled="submitting">{{ submitting ? 'Saving…' : (isEdit ? 'Save Changes' : 'Add Fullfil Payment') }}</button></div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'

const props = defineProps({ visible: Boolean, item: Object, mappings: { type: Array, default: () => [] }, units: { type: Array, default: () => [] }, submitting: Boolean })
const emit = defineEmits(['submit', 'cancel'])
const isEdit = computed(() => Boolean(props.item?.id))
const form = reactive({ fullfil_id: '', name: '', value: '', unit_id: '', notes: '' })
const errors = reactive({ fullfil_id: '', name: '', value: '', unit_id: '' })
watch(() => props.visible, (visible) => {
  if (!visible) return
  Object.assign(form, props.item ? { fullfil_id: String(props.item.fullfil_id || ''), name: props.item.name || '', value: props.item.value ?? '', unit_id: String(props.item.unit_id || ''), notes: props.item.notes || '' } : { fullfil_id: '', name: '', value: '', unit_id: '', notes: '' })
  Object.keys(errors).forEach((key) => { errors[key] = '' })
})
function submit() {
  errors.fullfil_id = form.fullfil_id ? '' : 'Fullfil Mapping is required.'
  errors.name = form.name ? '' : 'Name is required.'
  errors.value = form.value !== '' && form.value !== null ? '' : 'Value is required.'
  errors.unit_id = form.unit_id ? '' : 'Type of Unit is required.'
  if (Object.values(errors).some(Boolean)) return
  emit('submit', { fullfil_id: Number(form.fullfil_id), name: form.name, value: Number(form.value), unit_id: Number(form.unit_id), notes: form.notes || null })
}
</script>

<style scoped>
.field { display:flex; flex-direction:column; gap:.25rem; font-size:.875rem; font-weight:600; color:var(--text); }
.field input,.field select,.field textarea { border:1px solid var(--border); border-radius:.5rem; padding:.625rem .875rem; font-weight:400; color:var(--text); background:var(--surface-muted); outline:none; }
.field textarea { resize:none; }.required,.error { color:#ef4444; }.error { font-size:.75rem; font-weight:400; }.invalid { border-color:#f87171 !important; }
.button { border-radius:.5rem; padding:.625rem 1.25rem; font-size:.875rem; font-weight:600; cursor:pointer; }.button:disabled { opacity:.6; }.primary { border:0; background:#16a34a; color:white; }.secondary { border:1px solid var(--border); background:var(--surface); color:var(--text); }
</style>
