<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('tph.form.titleEdit', { name: tph.code || tph.name || '' }) : t('tph.add')"
    :subtitle="t('tph.form.subtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('tph.col.petak')" for-id="tph-petak" required full :hint="petakError || t('tph.form.petakHint')" :error="errors.id_block">
      <MdDropdown
        id="tph-petak"
        v-model="form.id_block"
        field
        :invalid="!!errors.id_block"
        :disabled="petakLoading"
        :placeholder="petakLoading ? t('tph.ui.loading') : t('tph.form.petakPlaceholder')"
        :options="petakOptions.map((p) => ({ value: p.id, label: `${p.name}${p.block_group ? ` · ${t('tph.blokLabel', { name: p.block_group })}` : ''}` }))" />
    </MdField>

    <MdField :label="t('tph.col.type')" required full :error="errors.tph_type">
      <MdSegmented v-model="form.tph_type" :aria-label="t('tph.form.typeAria')" :options="typeOptions" />
    </MdField>

    <MdField :label="t('tph.col.side')" required full :error="errors.side">
      <MdSegmented v-model="form.side" :aria-label="t('tph.col.side')" :options="sideOptions" />
    </MdField>

    <MdField :label="t('tph.form.line')" for-id="tph-line" required :hint="t('tph.form.lineHint', { code: code || '—' })" :error="errors.line_no">
      <input id="tph-line" v-model.number="form.line_no" class="md-input" :class="{ 'is-invalid': errors.line_no }" type="number" min="1" max="99" step="1" placeholder="1–99" />
    </MdField>

    <MdField :label="t('tph.form.trees')" for-id="tph-trees" :hint="t('tph.ui.optional')" :error="errors.tree_count">
      <input id="tph-trees" v-model.number="form.tree_count" class="md-input" :class="{ 'is-invalid': errors.tree_count }" type="number" min="0" step="1" :placeholder="t('tph.form.treesPlaceholder')" />
    </MdField>

    <MdField label="Latitude" for-id="tph-lat" :error="errors.latitude">
      <input id="tph-lat" v-model.trim="form.latitude" class="md-input" :class="{ 'is-invalid': errors.latitude }" inputmode="decimal" :placeholder="t('tph.form.latPlaceholder')" />
    </MdField>

    <MdField label="Longitude" for-id="tph-lng" :error="errors.longitude">
      <input id="tph-lng" v-model.trim="form.longitude" class="md-input" :class="{ 'is-invalid': errors.longitude }" inputmode="decimal" :placeholder="t('tph.form.lngPlaceholder')" />
    </MdField>

    <MdField :label="t('tph.ui.notes')" for-id="tph-notes" full :hint="t('tph.ui.optional')">
      <textarea id="tph-notes" v-model.trim="form.notes" class="md-input" rows="2" :placeholder="t('tph.form.notesPlaceholder')" style="resize: vertical; height: auto" />
    </MdField>

    <MdField full>
      <MdSwitch v-model="form.is_active" :label="t('tph.active')" :description="t('tph.form.activeDesc')" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('tph.ui.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('tph.ui.saving') : t('tph.ui.save') }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { listPetakOptions } from '../model'
import { MdModal, MdField, MdDropdown, MdSegmented, MdSwitch, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  tph: { type: Object, default: null },
  // Petak terpilih di filter daftar, dipakai sebagai bawaan saat menambah.
  defaultPetakId: { type: Number, default: null },
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.tph?.id))
const typeOptions = computed(() => [
  { value: 'PERAWATAN', label: t('tph.type.perawatan') },
  { value: 'PANEN', label: t('tph.type.panen') }
])
const sideOptions = computed(() => [
  { value: 'U', label: t('tph.form.sideU') },
  { value: 'S', label: t('tph.form.sideS') },
  { value: 'US', label: t('tph.form.sideUS') }
])

const emptyForm = () => ({
  id_block: props.defaultPetakId ?? null, tph_type: '', side: '', line_no: null,
  tree_count: null, is_active: true, latitude: '', longitude: '', notes: ''
})
const form = ref(emptyForm())
const errors = ref({})

const petakOptions = ref([])
const petakLoading = ref(false)
const petakError = ref('')

async function loadPetak() {
  if (petakOptions.value.length) return
  petakLoading.value = true
  petakError.value = ''
  try {
    const rows = await listPetakOptions()
    petakOptions.value = rows.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'id', { numeric: true }))
  } catch (err) {
    petakError.value = err?.message || t('tph.form.petakLoadFailed')
  } finally {
    petakLoading.value = false
  }
}

const code = computed(() =>
  form.value.side && Number.isInteger(form.value.line_no) ? `${form.value.side}${String(form.value.line_no).padStart(2, '0')}` : ''
)

watch(
  () => [props.visible, props.tph],
  ([visible, t]) => {
    if (!visible) return
    errors.value = {}
    form.value = t
      ? {
          id_block: t.id_block ?? null,
          tph_type: t.tph_type || '',
          side: t.side || '',
          line_no: t.line_no ?? null,
          tree_count: t.tree_count ?? null,
          is_active: t.is_active !== false,
          latitude: t.latitude || '',
          longitude: t.longitude || '',
          notes: t.notes || ''
        }
      : emptyForm()
    loadPetak()
  },
  { immediate: true }
)

const isBlank = (v) => v === null || v === undefined || v === ''

function validate() {
  const f = form.value
  const e = {}
  if (!f.id_block) e.id_block = t('tph.form.petakRequired')
  if (!f.tph_type) e.tph_type = t('tph.form.typeRequired')
  if (!f.side) e.side = t('tph.form.sideRequired')
  if (!Number.isInteger(f.line_no) || f.line_no < 1 || f.line_no > 99) e.line_no = '1–99.'
  if (!isBlank(f.tree_count) && (!Number.isInteger(f.tree_count) || f.tree_count < 0)) e.tree_count = t('tph.ui.int')
  if (f.latitude && !(Number(f.latitude) >= -90 && Number(f.latitude) <= 90)) e.latitude = t('tph.form.lat')
  if (f.longitude && !(Number(f.longitude) >= -180 && Number(f.longitude) <= 180)) e.longitude = t('tph.form.lng')
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  const f = form.value
  emit('submit', {
    id_block: f.id_block,
    tph_type: f.tph_type,
    side: f.side,
    line_no: f.line_no,
    tree_count: isBlank(f.tree_count) ? null : f.tree_count,
    is_active: !!f.is_active,
    latitude: f.latitude || null,
    longitude: f.longitude || null,
    notes: f.notes || null
  })
}

function onCancel() {
  emit('cancel')
}
</script>
