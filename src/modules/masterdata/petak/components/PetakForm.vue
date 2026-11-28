<template>
  <MdModal
    :open="visible"
    :title="isEdit ? t('petak.form.titleEdit', { name: petak.name }) : t('petak.add')"
    :subtitle="t('petak.form.subtitle')"
    as-form
    @close="onCancel"
    @submit="onSubmit">
    <MdField :label="t('petak.form.name')" for-id="petak-name" required :hint="t('petak.form.nameHint')" :error="errors.name">
      <input id="petak-name" v-model.trim="form.name" class="md-input" :class="{ 'is-invalid': errors.name }" maxlength="20" :placeholder="t('petak.form.namePlaceholder')" autocomplete="off" @blur="suggestBlok" />
    </MdField>

    <MdField :label="t('petak.filter.blok')" for-id="petak-blok" required :hint="blokError || t('petak.form.blokHint')" :error="errors.id_block_group">
      <MdDropdown
        id="petak-blok"
        v-model="form.id_block_group"
        field
        :invalid="!!errors.id_block_group"
        :disabled="bloksLoading"
        :placeholder="bloksLoading ? t('petak.ui.loading') : t('petak.form.blokPlaceholder')"
        :options="bloks.map((b) => ({ value: b.id, label: t('petak.blokLabel', { name: b.name }) }))" />
    </MdField>

    <MdField :label="t('petak.col.status')" full :hint="t('petak.form.statusHint')">
      <MdSegmented v-model="form.planting_status" :aria-label="t('petak.col.status')" :options="statusOptions" />
    </MdField>

    <MdField :label="t('petak.col.year')" for-id="petak-year" :hint="t('petak.form.yearHint', { max: maxYear })" :error="errors.planting_year">
      <input id="petak-year" v-model.number="form.planting_year" class="md-input" :class="{ 'is-invalid': errors.planting_year }" type="number" min="1950" :max="maxYear" step="1" :placeholder="t('petak.form.yearPlaceholder')" />
    </MdField>

    <MdField :label="t('petak.form.wide')" for-id="petak-wide" :hint="t('petak.ui.optional')" :error="errors.wide">
      <input id="petak-wide" v-model.number="form.wide" class="md-input" :class="{ 'is-invalid': errors.wide }" type="number" min="0" step="0.01" :placeholder="t('petak.form.widePlaceholder')" />
    </MdField>

    <MdField :label="t('petak.form.trees')" for-id="petak-plants" :hint="t('petak.ui.optional')" :error="errors.plants_count" full>
      <input id="petak-plants" v-model.number="form.plants_count" class="md-input" :class="{ 'is-invalid': errors.plants_count }" type="number" min="0" step="1" :placeholder="t('petak.form.treesPlaceholder')" />
    </MdField>

    <div v-if="error" class="md-modal__error" role="alert">{{ error }}</div>

    <template #footer>
      <button type="button" class="md-btn" :disabled="submitting" @click="onCancel">{{ t('petak.ui.cancel') }}</button>
      <button type="submit" class="md-btn md-btn--primary" :disabled="submitting">
        <MdIcon name="check" />{{ submitting ? t('petak.ui.saving') : t('petak.ui.save') }}
      </button>
    </template>
  </MdModal>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { listBlok } from '../model'
import { MdModal, MdField, MdDropdown, MdSegmented, MdIcon } from '../../../shared/masterdata-ui'

const props = defineProps({
  visible: { type: Boolean, default: false },
  petak: { type: Object, default: null },
  rows: { type: Array, default: () => [] }, // untuk cek nomor petak ganda
  submitting: { type: Boolean, default: false },
  error: { type: String, default: '' }
})
const emit = defineEmits(['submit', 'cancel'])
const { t } = useI18n()

const isEdit = computed(() => Boolean(props.petak?.id))
const maxYear = new Date().getFullYear()
const statusOptions = computed(() => [
  { value: '', label: t('petak.status.notSet') },
  { value: 'TBM', label: 'TBM' },
  { value: 'TM', label: 'TM' }
])

const emptyForm = () => ({ name: '', id_block_group: null, planting_status: '', planting_year: null, plants_count: null, wide: null })
const form = ref(emptyForm())
const errors = ref({})

const bloks = ref([])
const bloksLoading = ref(false)
const blokError = ref('')

async function loadBloks() {
  if (bloks.value.length) return
  bloksLoading.value = true
  blokError.value = ''
  try {
    const list = await listBlok()
    bloks.value = list.slice().sort((a, b) => String(a.name).localeCompare(String(b.name), 'id', { numeric: true }))
  } catch (err) {
    blokError.value = err?.message || t('petak.form.blokLoadFailed')
  } finally {
    bloksLoading.value = false
  }
}

// "113a" -> Blok 113, hanya bila blok belum dipilih.
function suggestBlok() {
  if (form.value.id_block_group) return
  const m = /^(\d+)/.exec(form.value.name || '')
  const hit = m && bloks.value.find((b) => String(b.name) === m[1])
  if (hit) form.value.id_block_group = hit.id
}

watch(
  () => [props.visible, props.petak],
  ([visible, p]) => {
    if (!visible) return
    errors.value = {}
    form.value = p
      ? {
          name: p.name || '',
          id_block_group: p.id_block_group ?? null,
          // Nilai yang disimpan, bukan hasil hitung (TM otomatis dari TPH panen).
          planting_status: p.planting_status_manual || '',
          planting_year: p.planting_year ?? null,
          plants_count: p.plants_count ?? null,
          wide: p.wide == null ? null : Number(p.wide)
        }
      : emptyForm()
    loadBloks()
  },
  { immediate: true }
)

const isBlank = (v) => v === null || v === undefined || v === ''

function validate() {
  const e = {}
  const f = form.value
  if (!f.name) e.name = t('petak.form.nameRequired')
  else if (props.rows.some((r) => r.id !== props.petak?.id && String(r.name).toLowerCase() === f.name.toLowerCase())) e.name = t('petak.form.nameDuplicate', { name: f.name })
  if (!f.id_block_group) e.id_block_group = t('petak.form.blokRequired')
  if (!isBlank(f.planting_year) && (!Number.isInteger(f.planting_year) || f.planting_year < 1950 || f.planting_year > maxYear)) e.planting_year = t('petak.form.yearRange', { max: maxYear })
  if (!isBlank(f.plants_count) && (!Number.isInteger(f.plants_count) || f.plants_count < 0)) e.plants_count = t('petak.ui.int')
  if (!isBlank(f.wide) && !(Number(f.wide) >= 0)) e.wide = t('petak.form.num')
  errors.value = e
  return Object.keys(e).length === 0
}

function onSubmit() {
  if (!validate()) return
  const f = form.value
  emit('submit', {
    name: f.name,
    id_block_group: f.id_block_group,
    planting_status: f.planting_status || null,
    planting_year: isBlank(f.planting_year) ? null : f.planting_year,
    plants_count: isBlank(f.plants_count) ? null : f.plants_count,
    wide: isBlank(f.wide) ? null : Number(f.wide)
  })
}

function onCancel() {
  emit('cancel')
}
</script>
