<template>
  <Teleport to="body">
    <div v-if="open" class="md-overlay" @mousedown.self="$emit('close')">
      <component
        :is="asForm ? 'form' : 'div'"
        ref="box"
        class="md-modal"
        :class="{ 'md-modal--sm': size === 'sm' }"
        :role="alert ? 'alertdialog' : 'dialog'"
        aria-modal="true"
        :aria-labelledby="titleId"
        novalidate
        @submit.prevent="$emit('submit')"
        @keydown="onKeydown">
        <div class="md-modal__head">
          <slot name="icon" />
          <div style="flex: 1; min-width: 0">
            <h3 :id="titleId">{{ title }}</h3>
            <p v-if="subtitle || $slots.subtitle"><slot name="subtitle">{{ subtitle }}</slot></p>
          </div>
          <button v-if="!alert" type="button" class="md-icon-btn" :aria-label="t('mdui.close')" @click="$emit('close')"><MdIcon name="x" /></button>
        </div>
        <div v-if="$slots.default" class="md-modal__body"><slot /></div>
        <div class="md-modal__foot"><slot name="footer" /></div>
      </component>
    </div>
  </Teleport>
</template>

<script setup>
// Modal Data Master. `asForm` membungkus isi dengan <form> (Enter = submit). Esc menutup; fokus dijaga di dalam.
import { nextTick, ref, watch } from 'vue'
import MdIcon from './MdIcon.vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps({
  open: { type: Boolean, default: false },
  title: { type: String, required: true },
  subtitle: { type: String, default: '' },
  size: { type: String, default: 'md' },
  asForm: { type: Boolean, default: false },
  alert: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'submit'])

const box = ref(null)
const titleId = `md-modal-${Math.random().toString(36).slice(2, 8)}`
let lastFocus = null

const boxEl = () => box.value?.$el || box.value
const focusables = () => {
  const el = boxEl()
  if (!el) return []
  return [...el.querySelectorAll('button:not([disabled]), input:not([disabled]), textarea, select, [tabindex]:not([tabindex="-1"])')]
}

watch(() => props.open, async (v) => {
  if (v) {
    lastFocus = document.activeElement
    await nextTick()
    const el = boxEl()
    const first = el?.querySelector('[autofocus], input, textarea, .md-dd__btn') || focusables()[0]
    first?.focus()
  } else if (lastFocus && typeof lastFocus.focus === 'function') {
    lastFocus.focus()
  }
})

function onKeydown(e) {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
    return
  }
  if (e.key !== 'Tab') return
  const f = focusables()
  if (!f.length) return
  if (e.shiftKey && document.activeElement === f[0]) {
    e.preventDefault()
    f[f.length - 1].focus()
  } else if (!e.shiftKey && document.activeElement === f[f.length - 1]) {
    e.preventDefault()
    f[0].focus()
  }
}
</script>
