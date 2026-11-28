<template>
  <div ref="root" class="md-dd" :class="{ 'md-dd--field': field }" @keydown="onKeydown">
    <button
      :id="id"
      ref="btn"
      type="button"
      class="md-dd__btn"
      :class="{ 'md-dd__btn--set': !field && isSet, 'md-dd__btn--field': field, 'is-invalid': invalid }"
      :disabled="disabled"
      aria-haspopup="listbox"
      :aria-expanded="String(open)"
      @click="toggle">
      <template v-if="field">
        <span :class="{ 'md-muted': !isSet }">{{ isSet ? summary : (placeholder ?? t('mdui.choose')) }}</span>
      </template>
      <template v-else>
        <span>{{ label }}</span>
        <span class="md-dd__v">{{ summary }}</span>
      </template>
      <MdIcon name="chevronDown" :size="16" />
    </button>

    <div
      v-if="open"
      ref="menu"
      class="md-menu"
      :class="{ 'md-menu--up': up, 'md-menu--full': field }"
      :role="$slots.default ? 'dialog' : 'listbox'"
      :aria-multiselectable="multiple ? 'true' : undefined"
      @click.stop>
      <slot :close="close">
        <button
          v-for="o in options"
          :key="String(o.value)"
          type="button"
          class="md-opt"
          role="option"
          :aria-checked="multiple ? String(isChosen(o.value)) : undefined"
          :aria-selected="!multiple ? String(isChosen(o.value)) : undefined"
          @click="choose(o.value)">
          <span v-if="multiple" class="md-opt__box"><MdIcon v-if="isChosen(o.value)" name="check" :size="12" :stroke="3" /></span>
          <span>{{ o.label }}</span>
          <span v-if="o.count != null" class="md-opt__cnt">{{ o.count }}</span>
          <span v-else-if="!multiple && isChosen(o.value)" class="md-opt__cnt"><MdIcon name="check" :size="14" /></span>
        </button>
        <p v-if="!options.length" class="md-opt md-muted" style="cursor: default">{{ emptyText ?? t('mdui.noOptions') }}</p>
        <template v-if="multiple && isSet">
          <div class="md-menu__sep" />
          <button type="button" class="md-opt" @click="clear">{{ t('mdui.clearSelection') }}</button>
        </template>
      </slot>
    </div>
  </div>
</template>

<script setup>
// Dropdown kustom Data Master.
// - Filter multi-pilih: v-model = array, `multiple`.
// - Filter/isian satu pilihan: v-model = nilai tunggal.
// - `field`: tampilan isian form (lebar penuh, placeholder).
// - Slot default: isi menu kustom (mis. rentang tahun); `active`/`summaryText` mengatur label tombol.
import { computed, nextTick, onBeforeUnmount, ref } from 'vue'
import MdIcon from './MdIcon.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  modelValue: { type: [Array, String, Number, Boolean, null], default: null },
  options: { type: Array, default: () => [] }, // [{ value, label, count? }]
  label: { type: String, default: '' },
  placeholder: { type: String, default: undefined },
  allText: { type: String, default: undefined },
  emptyText: { type: String, default: undefined },
  multiple: { type: Boolean, default: false },
  field: { type: Boolean, default: false },
  invalid: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  up: { type: Boolean, default: false },
  id: { type: String, default: undefined },
  active: { type: Boolean, default: undefined }, // untuk isi slot kustom
  summaryText: { type: String, default: '' }
})
const emit = defineEmits(['update:modelValue', 'change'])

const open = ref(false)
const root = ref(null)
const btn = ref(null)
const menu = ref(null)

const chosen = computed(() =>
  props.multiple ? (Array.isArray(props.modelValue) ? props.modelValue : []) : props.modelValue
)
// Bandingkan sebagai teks: id dari API bisa angka atau string.
const same = (a, b) => a != null && b != null && String(a) === String(b)
const isChosen = (v) => (props.multiple ? chosen.value.some((x) => same(x, v)) : same(chosen.value, v))
const isSet = computed(() => {
  if (props.active !== undefined) return props.active
  return props.multiple ? chosen.value.length > 0 : chosen.value !== null && chosen.value !== undefined && chosen.value !== ''
})
const labelOf = (v) => props.options.find((o) => same(o.value, v))?.label ?? String(v)
const summary = computed(() => {
  if (props.summaryText) return props.summaryText
  if (!isSet.value) return props.allText ?? t('mdui.all')
  if (props.multiple) return chosen.value.length === 1 ? labelOf(chosen.value[0]) : t('mdui.nSelected', { n: chosen.value.length })
  return labelOf(chosen.value)
})

function set(v) {
  emit('update:modelValue', v)
  emit('change', v)
}
function choose(v) {
  if (props.multiple) {
    const next = chosen.value.some((x) => same(x, v)) ? chosen.value.filter((x) => !same(x, v)) : [...chosen.value, v]
    set(next)
  } else {
    set(v)
    close()
  }
}
function clear() {
  set(props.multiple ? [] : null)
}

function onDocClick(e) {
  if (root.value && !root.value.contains(e.target)) close()
}
function close(refocus = false) {
  if (!open.value) return
  open.value = false
  document.removeEventListener('mousedown', onDocClick)
  if (refocus) btn.value?.focus()
}
async function toggle() {
  if (open.value) return close()
  open.value = true
  document.addEventListener('mousedown', onDocClick)
  await nextTick()
  const first = menu.value?.querySelector('[aria-selected="true"], [aria-checked="true"], .md-opt, input')
  first?.focus()
}
function onKeydown(e) {
  if (!open.value) return
  if (e.key === 'Escape') {
    e.stopPropagation()
    close(true)
    return
  }
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return
  const items = [...(menu.value?.querySelectorAll('button.md-opt') || [])]
  if (!items.length) return
  e.preventDefault()
  const i = items.indexOf(document.activeElement)
  const n = e.key === 'ArrowDown' ? (i + 1) % items.length : (i - 1 + items.length) % items.length
  items[n].focus()
}
onBeforeUnmount(() => document.removeEventListener('mousedown', onDocClick))

defineExpose({ close })
</script>
