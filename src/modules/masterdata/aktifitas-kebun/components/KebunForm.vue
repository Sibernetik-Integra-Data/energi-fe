<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('aktifitasKebun.form.titleEdit', { name: activity.name || '' }).trim() : t('aktifitasKebun.add')"
    :subtitle="t('aktifitasKebun.form.subtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('aktifitasKebun.ui.name')" for-id="kebun-name" required :error="errors.name">
      <input id="kebun-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" type="text" :placeholder="t('aktifitasKebun.form.namePlaceholder')" autocomplete="off" />
    </MdField>

    <MdField :label="t('aktifitasKebun.form.group')" for-id="kebun-group" required :hint="groupLoadError || ''" :error="errors.group_of_work">
      <MdDropdown
        id="kebun-group"
        v-model="form.group_of_work"
        field
        :invalid="!!errors.group_of_work"
        :disabled="groupsLoading"
        :placeholder="groupsLoading ? t('aktifitasKebun.form.groupLoading') : t('aktifitasKebun.form.groupPlaceholder')"
        :options="groups.map((g) => ({ value: g.id, label: g.name }))" />
    </MdField>

    <MdField :label="t('aktifitasKebun.detail')" for-id="kebun-detail" full>
      <textarea id="kebun-detail" v-model.trim="form.detail" class="md-input" rows="3" :placeholder="t('aktifitasKebun.form.detailPlaceholder')" />
    </MdField>

    <div class="md-field md-field--full">
      <MdSwitch v-model="form.is_upload" :label="t('aktifitasKebun.form.upload')" :description="t('aktifitasKebun.form.uploadDesc')" />
    </div>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('aktifitasKebun.ui.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('aktifitasKebun.ui.saving') : isEdit ? t('aktifitasKebun.ui.saveChanges') : t('aktifitasKebun.add') }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { listGroupOfWork } from '../model'
import { MdModal, MdField, MdDropdown, MdSwitch, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  activity: { type: Object, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.activity?.id))

const emptyForm = () => ({ name: '', detail: '', group_of_work: '', is_upload: false })
const form = ref(emptyForm())
const errors = ref({})

const groups = ref([])
const groupsLoading = ref(false)
const groupLoadError = ref(null)

async function loadGroups() {
  if (groups.value.length > 0) return
  groupsLoading.value = true
  groupLoadError.value = null
  try {
    groups.value = await listGroupOfWork()
  } catch (err) {
    console.error('[KebunForm] Failed to load groups:', err)
    groupLoadError.value = err?.message || t('aktifitasKebun.form.groupLoadFailed')
  } finally {
    groupsLoading.value = false
  }
}

watch(
  () => [props.visible, props.activity],
  ([visible, activity]) => {
    if (!visible) return
    form.value = activity
      ? {
          name: activity.name || '',
          detail: activity.detail || '',
          group_of_work: activity.group_of_work ?? '',
          is_upload: Boolean(Number(activity.is_upload))
        }
      : emptyForm()
    errors.value = {}
    loadGroups()
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  if (!form.value.name) errs.name = t('aktifitasKebun.ui.nameRequired')
  if (form.value.group_of_work === '' || form.value.group_of_work == null) {
    errs.group_of_work = t('aktifitasKebun.form.groupRequired')
  }
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  const selectedGroup = groups.value.find((g) => String(g.id) === String(form.value.group_of_work))
  emit('submit', {
    ...form.value,
    // Kolom DB smallint 0/1.
    is_upload: form.value.is_upload ? 1 : 0,
    group_of_work_name: selectedGroup?.name ?? null
  })
}

function onCancel() {
  emit('cancel')
}
</script>
