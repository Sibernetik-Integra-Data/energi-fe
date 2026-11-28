<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('fullfilMapping.formEdit', { name: fullfil.name || '' }).trim() : t('fullfilMapping.formAdd')"
    :subtitle="t('fullfilMapping.formSubtitle')"
    as-form
    @close="emit('cancel')"
    @submit="submit">
    <MdField :label="t('fullfilMapping.col.name')" for-id="fm-name" required :error="errors.name">
      <input id="fm-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" type="text" maxlength="50" :placeholder="t('fullfilMapping.namePlaceholder')" autocomplete="off" />
    </MdField>

    <MdField :label="t('fullfilMapping.titleLabel')" for-id="fm-title" :hint="t('fullfilMapping.form.optional')">
      <input id="fm-title" v-model.trim="form.title" class="md-input" type="text" maxlength="100" :placeholder="t('fullfilMapping.titlePlaceholder')" autocomplete="off" />
    </MdField>

    <MdField :label="t('fullfilMapping.workType')" for-id="fm-tow" required :error="errors.tow_id">
      <MdDropdown id="fm-tow" v-model="form.tow_id" field :invalid="!!errors.tow_id" :placeholder="t('fullfilMapping.selectWork')"
        :options="typeOfWorks.map((item) => ({ value: String(item.id), label: item.name || `#${item.id}` }))" />
    </MdField>

    <MdField :label="t('fullfilMapping.needType')" for-id="fm-ton" required :error="errors.ton_id">
      <MdDropdown id="fm-ton" v-model="form.ton_id" field :invalid="!!errors.ton_id" :placeholder="t('fullfilMapping.selectNeed')"
        :options="typeOfNeeds.map((item) => ({ value: String(item.id), label: item.name || `#${item.id}` }))" />
    </MdField>

    <MdField :label="t('fullfilMapping.access')" full :hint="t('fullfilMapping.accessHint')">
      <MdSegmented v-model="form.access" :aria-label="t('fullfilMapping.access')" :options="accessOptions" />
    </MdField>

    <MdField :label="t('fullfilMapping.col.notes')" for-id="fm-notes" full :hint="t('fullfilMapping.form.optional')">
      <textarea id="fm-notes" v-model.trim="form.notes" class="md-input" rows="3" maxlength="500" style="resize: none" />
    </MdField>

    <MdField full>
      <MdSwitch v-model="form.is_view" :label="t('fullfilMapping.view')" :description="t('fullfilMapping.viewDescription')" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="emit('cancel')">{{ t('fullfilMapping.form.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('fullfilMapping.form.saving') : (isEdit ? t('fullfilMapping.form.saveChanges') : t('fullfilMapping.add')) }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { MdModal, MdField, MdDropdown, MdSegmented, MdSwitch, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({ visible: Boolean, fullfil: Object, typeOfWorks: { type: Array, default: () => [] }, typeOfNeeds: { type: Array, default: () => [] }, submitting: Boolean, error: { type: String, default: '' } })
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()
const isEdit = computed(() => Boolean(props.fullfil?.id))
const accessOptions = computed(() => [{ value: '', label: t('fullfilMapping.accessDefault') }, { value: 'admin', label: t('fullfilMapping.admin') }, { value: 'pekerja', label: t('fullfilMapping.worker') }])
const form = reactive({ name: '', title: '', tow_id: '', ton_id: '', access: '', notes: '', is_view: true })
const errors = reactive({ name: '', tow_id: '', ton_id: '' })

watch(() => props.visible, (visible) => {
  if (!visible) return
  Object.assign(form, props.fullfil ? { name: props.fullfil.name || '', title: props.fullfil.title || '', tow_id: String(props.fullfil.tow_id || ''), ton_id: String(props.fullfil.ton_id || ''), access: props.fullfil.access || '', notes: props.fullfil.notes || '', is_view: props.fullfil.is_view !== 0 } : { name: '', title: '', tow_id: '', ton_id: '', access: '', notes: '', is_view: true })
  errors.name = ''; errors.tow_id = ''; errors.ton_id = ''
}, { immediate: true })

function submit() {
  // name is required by the database.
  errors.name = form.name ? '' : t('fullfilMapping.form.nameRequired')
  errors.tow_id = form.tow_id ? '' : t('fullfilMapping.workRequired')
  errors.ton_id = form.ton_id ? '' : t('fullfilMapping.needRequired')
  if (errors.name || errors.tow_id || errors.ton_id) return
  const payload = { name: form.name, title: form.title || null, tow_id: Number(form.tow_id), ton_id: Number(form.ton_id), notes: form.notes || null, is_view: form.is_view ? 1 : 0 }
  // access is NOT NULL in the table: leave it out when nothing is chosen so the default applies.
  if (form.access) payload.access = form.access
  emit('submit', payload)
}
</script>
