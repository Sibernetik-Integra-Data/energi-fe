<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('sensusProgressStatus.formEdit') : t('sensusProgressStatus.add')"
    :subtitle="t('sensusProgressStatus.formSubtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('sensusProgressStatus.col.name')" for-id="sps-name" required full :hint="t('sensusProgressStatus.form.max100')" :error="errors.name">
      <input
        id="sps-name"
        v-model.trim="form.name"
        class="md-input"
        :class="{ 'is-invalid': errors.name }"
        type="text"
        :placeholder="t('sensusProgressStatus.namePlaceholder')"
        maxlength="100"
        autocomplete="off"
        aria-required="true"
        :aria-invalid="Boolean(errors.name)" />
    </MdField>

    <MdField :label="t('sensusProgressStatus.col.detail')" for-id="sps-detail" full :hint="t('sensusProgressStatus.form.optionalMax500')" :error="errors.detail">
      <textarea id="sps-detail" v-model.trim="form.detail" class="md-input" :class="{ 'is-invalid': errors.detail }" rows="3" maxlength="500" :placeholder="t('sensusProgressStatus.form.detailPlaceholder')" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('sensusProgressStatus.form.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('sensusProgressStatus.form.saving') : isEdit ? t('sensusProgressStatus.form.saveChanges') : t('sensusProgressStatus.add') }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { MdModal, MdField, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  status: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.status?.id))

const emptyForm = () => ({ name: '', detail: '' })
const form = ref(emptyForm())
const errors = ref({})

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    form.value = props.status ? { name: props.status.name || '', detail: props.status.detail || '' } : emptyForm()
    errors.value = {}
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  if (!form.value.name) errs.name = t('sensusProgressStatus.form.nameRequired')
  else if (form.value.name.length > 100) errs.name = t('sensusProgressStatus.form.nameMax100')
  if (form.value.detail && form.value.detail.length > 500) errs.detail = t('sensusProgressStatus.form.detailMax500')
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  const payload = { name: form.value.name }
  if (form.value.detail) payload.detail = form.value.detail
  emit('submit', payload)
}

function onCancel() {
  emit('cancel')
}
</script>
