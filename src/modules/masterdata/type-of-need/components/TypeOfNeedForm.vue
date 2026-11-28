<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('typeOfNeed.formEdit', { name: typeOfNeed.name || '' }) : t('typeOfNeed.add')"
    :subtitle="t('typeOfNeed.formSubtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('typeOfNeed.col.name')" for-id="ton-name" required :hint="t('typeOfNeed.form.max100')" :error="errors.name">
      <input id="ton-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="100" :placeholder="t('typeOfNeed.namePlaceholder')" autocomplete="off" />
    </MdField>

    <MdField :label="t('typeOfNeed.col.unit')" for-id="ton-unit" required :hint="unitsError || t('typeOfNeed.unitHint')" :error="errors.unit_id">
      <MdDropdown
        id="ton-unit"
        v-model="form.unit_id"
        field
        :invalid="!!errors.unit_id"
        :disabled="unitsLoading"
        :placeholder="unitsLoading ? t('typeOfNeed.form.loading') : t('typeOfNeed.form.selectUnit')"
        :options="units.map((u) => ({ value: u.id, label: u.detail ? `${u.name} · ${u.detail}` : u.name }))" />
    </MdField>

    <MdField :label="t('typeOfNeed.col.detail')" for-id="ton-detail" full :hint="t('typeOfNeed.form.optionalMax500')" :error="errors.detail">
      <textarea id="ton-detail" v-model.trim="form.detail" class="md-input" :class="{ 'is-invalid': errors.detail }" rows="3" maxlength="500" :placeholder="t('typeOfNeed.form.detailPlaceholder')" />
    </MdField>

    <MdField :label="t('typeOfNeed.col.notes')" for-id="ton-notes" full :hint="t('typeOfNeed.form.optionalMax500')" :error="errors.notes">
      <textarea id="ton-notes" v-model.trim="form.notes" class="md-input" :class="{ 'is-invalid': errors.notes }" rows="3" maxlength="500" :placeholder="t('typeOfNeed.form.notesPlaceholder')" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('typeOfNeed.form.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('typeOfNeed.form.saving') : isEdit ? t('typeOfNeed.form.saveChanges') : t('typeOfNeed.form.save') }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { listTypeOfUnits } from '../model'
import { MdModal, MdField, MdDropdown, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  typeOfNeed: { type: Object, default: null },
  rows: { type: Array, default: () => [] }, // untuk cek nama ganda
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.typeOfNeed?.id))
// Tabel type_of_need tidak punya kolom status; satuan (unit_id) dari Type of Unit.
const emptyForm = () => ({ name: '', detail: '', notes: '', unit_id: null })
const form = ref(emptyForm())
const errors = ref({})

const units = ref([])
const unitsLoading = ref(false)
const unitsError = ref('')

async function loadUnits() {
  if (units.value.length) return
  unitsLoading.value = true
  unitsError.value = ''
  try {
    units.value = await listTypeOfUnits()
  } catch (err) {
    unitsError.value = err?.message || t('typeOfNeed.unitsLoadFailed')
  } finally {
    unitsLoading.value = false
  }
}

watch(
  () => props.visible,
  (val) => {
    if (!val) return
    const t = props.typeOfNeed
    form.value = t ? { name: t.name || '', detail: t.detail || '', notes: t.notes || '', unit_id: t.unit_id ?? null } : emptyForm()
    errors.value = {}
    loadUnits()
  },
  { immediate: true }
)

function validate() {
  const errs = {}
  const f = form.value
  if (!f.name) errs.name = t('typeOfNeed.form.nameRequired')
  else if (f.name.length > 100) errs.name = t('typeOfNeed.form.nameMax100')
  else if (props.rows.some((r) => r.id !== props.typeOfNeed?.id && String(r.name || '').toLowerCase() === f.name.toLowerCase())) errs.name = t('typeOfNeed.duplicate', { name: f.name })
  if (f.detail && f.detail.length > 500) errs.detail = t('typeOfNeed.form.detailMax500')
  if (f.notes && f.notes.length > 500) errs.notes = t('typeOfNeed.form.notesMax500')
  if (!f.unit_id) errs.unit_id = t('typeOfNeed.form.unitRequired')
  errors.value = errs
  return Object.keys(errs).length === 0
}

function onSubmit() {
  if (!validate()) return
  const f = form.value
  emit('submit', { name: f.name, detail: f.detail || null, notes: f.notes || null, unit_id: f.unit_id })
}

function onCancel() {
  emit('cancel')
}
</script>
