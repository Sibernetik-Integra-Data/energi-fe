<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('groupOfWork.form.titleEdit') : t('groupOfWork.form.titleAdd')"
    :subtitle="t('groupOfWork.form.subtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('groupOfWork.ui.name')" for-id="gow-name" required full :hint="t('groupOfWork.form.nameHint')" :error="errors.name">
      <input
        id="gow-name"
        v-model.trim="form.name"
        class="md-input"
        :class="{ 'is-invalid': errors.name }"
        type="text"
        :placeholder="t('groupOfWork.form.namePlaceholder')"
        maxlength="100"
        autocomplete="off"
        :aria-invalid="!!errors.name" />
    </MdField>

    <MdField :label="t('groupOfWork.tphType')" required full :hint="t('groupOfWork.form.tphHint')">
      <MdSegmented v-model="form.tph_type" :aria-label="t('groupOfWork.tphType')" :options="tphOptions" />
    </MdField>

    <MdField :label="t('groupOfWork.detail')" for-id="gow-detail" full :hint="t('groupOfWork.ui.optional')">
      <textarea id="gow-detail" v-model="form.detail" class="md-input" rows="4" :placeholder="t('groupOfWork.form.detailPlaceholder')" maxlength="2000" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('groupOfWork.ui.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('groupOfWork.ui.saving') : isEdit ? t('groupOfWork.ui.saveChanges') : t('groupOfWork.add') }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MdModal, MdField, MdSegmented, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  group: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.group?.id))
const tphOptions = computed(() => [
  { value: 'PERAWATAN', label: t('groupOfWork.type.perawatan') },
  { value: 'PANEN', label: t('groupOfWork.type.panen') }
])

const emptyForm = () => ({ name: '', detail: '', tph_type: 'PERAWATAN' })
const form = ref(emptyForm())
const errors = ref({})

watch(
  () => [props.visible, props.group],
  ([visible, group]) => {
    if (!visible) return
    form.value = group ? { name: group.name || '', detail: group.detail || '', tph_type: group.tph_type || 'PERAWATAN' } : emptyForm()
    errors.value = {}
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  if (!form.value.name) errs.name = t('groupOfWork.ui.nameRequired')
  else if (form.value.name.length > 100) errs.name = t('groupOfWork.form.nameMax')
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  emit('submit', { name: form.value.name, detail: form.value.detail, tph_type: form.value.tph_type })
}

function onCancel() {
  emit('cancel')
}
</script>
