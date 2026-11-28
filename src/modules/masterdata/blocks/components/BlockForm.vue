<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('blocks.form.titleEdit', { name: block.name }) : t('blocks.add')"
    :subtitle="t('blocks.form.subtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('blocks.form.name')" for-id="blok-name" required full :hint="t('blocks.form.nameHint')" :error="errors.name">
      <input id="blok-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="20" :placeholder="t('blocks.form.namePlaceholder')" autocomplete="off" />
    </MdField>

    <MdField :label="t('blocks.ui.notes')" for-id="blok-notes" full :hint="t('blocks.ui.optional')">
      <textarea id="blok-notes" v-model.trim="form.notes" class="md-input" rows="3" :placeholder="t('blocks.form.notesPlaceholder')" style="resize: vertical; height: auto" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('blocks.ui.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('blocks.ui.saving') : t('blocks.ui.save') }}
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
  block: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.block?.id))
const form = ref({ name: '', notes: '' })
const errors = ref({})

watch(
  () => [props.visible, props.block],
  ([visible, b]) => {
    if (!visible) return
    errors.value = {}
    form.value = { name: b?.name || '', notes: b?.notes || '' }
  },
  { immediate: true }
)

function onSubmit() {
  errors.value = form.value.name ? {} : { name: t('blocks.form.nameRequired') }
  if (errors.value.name) return
  emit('submit', { name: form.value.name, notes: form.value.notes || null })
}

function onCancel() {
  emit('cancel')
}
</script>
