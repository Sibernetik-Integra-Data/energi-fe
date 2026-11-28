<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('typeOfAccept.formEdit', { name: typeOfAccept.name || '' }) : t('typeOfAccept.add')"
    :subtitle="t('typeOfAccept.formSubtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('typeOfAccept.col.name')" for-id="toa-name" required :hint="t('typeOfAccept.nameHint')" :error="errors.name">
      <input id="toa-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="100" :placeholder="t('typeOfAccept.namePlaceholder')" autocomplete="off" />
    </MdField>

    <MdField :label="t('typeOfAccept.statusLabel')" for-id="toa-status" required :hint="t('typeOfAccept.statusHint')" :error="errors.status">
      <input id="toa-status" v-model.trim="form.status" class="md-input" :class="{ 'is-invalid': errors.status }" maxlength="100" :placeholder="t('typeOfAccept.statusPlaceholder')" autocomplete="off" list="toa-status-list" />
      <datalist id="toa-status-list">
        <option v-for="s in statusSuggestions" :key="s" :value="s" />
      </datalist>
    </MdField>

    <MdField :label="t('typeOfAccept.col.detail')" for-id="toa-detail" full :hint="t('typeOfAccept.form.optionalMax500')" :error="errors.detail">
      <textarea id="toa-detail" v-model.trim="form.detail" class="md-input" :class="{ 'is-invalid': errors.detail }" rows="3" maxlength="500" :placeholder="t('typeOfAccept.form.detailPlaceholder')" />
    </MdField>

    <MdField :label="t('typeOfAccept.col.notes')" for-id="toa-notes" full :hint="t('typeOfAccept.form.optionalMax500')" :error="errors.notes">
      <textarea id="toa-notes" v-model.trim="form.notes" class="md-input" :class="{ 'is-invalid': errors.notes }" rows="3" maxlength="500" :placeholder="t('typeOfAccept.form.notesPlaceholder')" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('typeOfAccept.form.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('typeOfAccept.form.saving') : isEdit ? t('typeOfAccept.form.saveChanges') : t('typeOfAccept.form.save') }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MdModal, MdField, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  typeOfAccept: { type: Object, default: null },
  rows: { type: Array, default: () => [] }, // untuk cek nama ganda & saran label
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.typeOfAccept?.id))
const statusSuggestions = computed(() => [...new Set(props.rows.map((r) => r.status).filter(Boolean))].sort())
const emptyForm = () => ({ name: '', detail: '', notes: '', status: '' })
const form = ref(emptyForm())
const errors = ref({})

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    const t = props.typeOfAccept
    form.value = t ? { name: t.name || '', detail: t.detail || '', notes: t.notes || '', status: t.status || '' } : emptyForm()
    errors.value = {}
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  const f = form.value
  if (!f.name) errs.name = t('typeOfAccept.form.nameRequired')
  else if (f.name.length > 100) errs.name = t('typeOfAccept.form.nameMax100')
  else if (props.rows.some((r) => r.id !== props.typeOfAccept?.id && String(r.name || '').toLowerCase() === f.name.toLowerCase())) errs.name = t('typeOfAccept.duplicate', { name: f.name })
  if (f.detail && f.detail.length > 500) errs.detail = t('typeOfAccept.form.detailMax500')
  if (f.notes && f.notes.length > 500) errs.notes = t('typeOfAccept.form.notesMax500')
  if (!f.status) errs.status = t('typeOfAccept.statusRequired')
  else if (f.status.length > 100) errs.status = t('typeOfAccept.statusMax100')
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  const f = form.value
  emit('submit', { name: f.name, detail: f.detail || null, notes: f.notes || null, status: f.status || null })
}

function onCancel() {
  emit('cancel')
}
</script>
