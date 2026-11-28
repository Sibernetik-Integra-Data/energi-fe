<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('typeOfUnit.formEdit', { name: typeOfUnit.name || '' }) : t('typeOfUnit.add')"
    :subtitle="t('typeOfUnit.formSubtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('typeOfUnit.col.name')" for-id="tou-name" required full :hint="t('typeOfUnit.nameHint')" :error="errors.name">
      <input id="tou-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="100" :placeholder="t('typeOfUnit.namePlaceholder')" autocomplete="off" />
    </MdField>

    <MdField :label="t('typeOfUnit.col.detail')" for-id="tou-detail" full :hint="t('typeOfUnit.detailHint')" :error="errors.detail">
      <textarea id="tou-detail" v-model.trim="form.detail" class="md-input" :class="{ 'is-invalid': errors.detail }" rows="3" maxlength="500" :placeholder="t('typeOfUnit.form.detailPlaceholder')" />
    </MdField>

    <MdField :label="t('typeOfUnit.col.notes')" for-id="tou-notes" full :hint="t('typeOfUnit.form.optionalMax500')" :error="errors.notes">
      <textarea id="tou-notes" v-model.trim="form.notes" class="md-input" :class="{ 'is-invalid': errors.notes }" rows="3" maxlength="500" :placeholder="t('typeOfUnit.form.notesPlaceholder')" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('typeOfUnit.form.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('typeOfUnit.form.saving') : isEdit ? t('typeOfUnit.form.saveChanges') : t('typeOfUnit.form.save') }}
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
  typeOfUnit: { type: Object, default: null },
  rows: { type: Array, default: () => [] }, // untuk cek nama ganda
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.typeOfUnit?.id))
const emptyForm = () => ({ name: '', detail: '', notes: '' })
const form = ref(emptyForm())
const errors = ref({})

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    const t = props.typeOfUnit
    form.value = t ? { name: t.name || '', detail: t.detail || '', notes: t.notes || '' } : emptyForm()
    errors.value = {}
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  const f = form.value
  if (!f.name) errs.name = t('typeOfUnit.form.nameRequired')
  else if (f.name.length > 100) errs.name = t('typeOfUnit.form.nameMax100')
  else if (props.rows.some((r) => r.id !== props.typeOfUnit?.id && String(r.name || '').toLowerCase() === f.name.toLowerCase())) errs.name = t('typeOfUnit.duplicate', { name: f.name })
  if (f.detail && f.detail.length > 500) errs.detail = t('typeOfUnit.form.detailMax500')
  if (f.notes && f.notes.length > 500) errs.notes = t('typeOfUnit.form.notesMax500')
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { name: form.value.name, detail: form.value.detail || null, notes: form.value.notes || null })
}

function onCancel() {
  emit('cancel')
}
</script>
