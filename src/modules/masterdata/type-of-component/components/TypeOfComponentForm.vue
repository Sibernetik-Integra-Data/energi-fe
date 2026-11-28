<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('typeOfComponent.formEdit', { name: typeOfComponent.name || '' }) : t('typeOfComponent.add')"
    :subtitle="t('typeOfComponent.formSubtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('typeOfComponent.col.name')" for-id="toc-name" required full :hint="t('typeOfComponent.form.max100')" :error="errors.name">
      <input id="toc-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="100" :placeholder="t('typeOfComponent.namePlaceholder')" autocomplete="off" />
    </MdField>

    <MdField :label="t('typeOfComponent.col.detail')" for-id="toc-detail" full :hint="t('typeOfComponent.form.optionalMax500')" :error="errors.detail">
      <textarea id="toc-detail" v-model.trim="form.detail" class="md-input" :class="{ 'is-invalid': errors.detail }" rows="3" maxlength="500" :placeholder="t('typeOfComponent.form.detailPlaceholder')" />
    </MdField>

    <MdField :label="t('typeOfComponent.col.notes')" for-id="toc-notes" full :hint="t('typeOfComponent.form.optionalMax500')" :error="errors.notes">
      <textarea id="toc-notes" v-model.trim="form.notes" class="md-input" :class="{ 'is-invalid': errors.notes }" rows="3" maxlength="500" :placeholder="t('typeOfComponent.form.notesPlaceholder')" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('typeOfComponent.form.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('typeOfComponent.form.saving') : isEdit ? t('typeOfComponent.form.saveChanges') : t('typeOfComponent.form.save') }}
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
  typeOfComponent: { type: Object, default: null },
  rows: { type: Array, default: () => [] }, // untuk cek nama ganda
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.typeOfComponent?.id))
const emptyForm = () => ({ name: '', detail: '', notes: '' })
const form = ref(emptyForm())
const errors = ref({})

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    const t = props.typeOfComponent
    form.value = t ? { name: t.name || '', detail: t.detail || '', notes: t.notes || '' } : emptyForm()
    errors.value = {}
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  const f = form.value
  if (!f.name) errs.name = t('typeOfComponent.form.nameRequired')
  else if (f.name.length > 100) errs.name = t('typeOfComponent.form.nameMax100')
  else if (props.rows.some((r) => r.id !== props.typeOfComponent?.id && String(r.name || '').toLowerCase() === f.name.toLowerCase())) errs.name = t('typeOfComponent.duplicate', { name: f.name })
  if (f.detail && f.detail.length > 500) errs.detail = t('typeOfComponent.form.detailMax500')
  if (f.notes && f.notes.length > 500) errs.notes = t('typeOfComponent.form.notesMax500')
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
